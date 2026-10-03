-- KEYS[1]: stock_key (tier:{tier_id}:stock)
-- KEYS[2]: user_lock_key (user:{user_id}:tier:{tier_id})
-- KEYS[3]: reservation_hash_key (reservation:{token})
-- KEYS[4]: expiry_zset_key (reservations:expiry_zset)
-- ARGV[1]: requested_quantity
-- ARGV[2]: reservation_token
-- ARGV[3]: user_id
-- ARGV[4]: tier_id
-- ARGV[5]: holding_ttl_seconds
-- ARGV[6]: current_epoch_seconds

local current_stock = tonumber(redis.call('GET', KEYS[1]) or 0)
local requested_qty = tonumber(ARGV[1])
local ttl_seconds = tonumber(ARGV[5])
local current_epoch = tonumber(ARGV[6])

if current_stock < requested_qty then
    return -1
end

local user_has_lock = redis.call('EXISTS', KEYS[2])
if user_has_lock == 1 then
    return -2
end

redis.call('DECRBY', KEYS[1], requested_qty)

redis.call('HSET', KEYS[3],
    'user_id', ARGV[3],
    'tier_id', ARGV[4],
    'quantity', requested_qty,
    'status', 'LOCKED',
    'created_at', current_epoch
)
redis.call('EXPIRE', KEYS[3], ttl_seconds)

redis.call('SET', KEYS[2], ARGV[2], 'EX', ttl_seconds)

local expiry_timestamp = current_epoch + ttl_seconds
redis.call('ZADD', KEYS[4], expiry_timestamp, ARGV[2])

return 1
