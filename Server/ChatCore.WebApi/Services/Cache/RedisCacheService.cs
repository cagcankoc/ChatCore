using ChatCore.WebApi.Interfaces.Services;
using StackExchange.Redis;
using System.Text.Json;

namespace ChatCore.WebApi.Services.Cache
{
    public class RedisCacheService : ICacheService
    {
        private readonly IConnectionMultiplexer _redis;

        public RedisCacheService(IConnectionMultiplexer redis)
        {
            _redis = redis;
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            var db = _redis.GetDatabase();
            var value = await db.StringGetAsync(key);
            return value.HasValue ? JsonSerializer.Deserialize<T>(value!) : default;
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
        {
            var db = _redis.GetDatabase();
            var serializedValue = JsonSerializer.Serialize(value);
            await db.StringSetAsync(key, serializedValue, expiration);
        }

        public async Task RemoveAsync(string key)
        {
            var db = _redis.GetDatabase();
            await db.KeyDeleteAsync(key);
        }
    }
}
