using MySql.Data.MySqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace ISPSystem.Services
{
    public class RadiusService
    {
        private readonly string _connectionString;
        private readonly ILogger<RadiusService> _logger;

        public RadiusService(IConfiguration config, ILogger<RadiusService> logger)
        {
            _connectionString = config.GetConnectionString("RadiusConnection")
                ?? config.GetConnectionString("DefaultConnection");

            _logger = logger;
        }

        /// <summary>
        /// إنشاء مستخدم في RADIUS مع كلمة المرور + السرعة + تاريخ الانتهاء
        /// </summary>
        public async Task<bool> CreateUser(string username, string password, string speed, DateTime? expiration = null)
        {
            try
            {
                using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();

                // حذف أي بيانات قديمة أولاً
                await DeleteUserInternal(conn, username);

                // 1. كلمة المرور
                await ExecuteNonQuery(conn,
                    "INSERT INTO radcheck (username, attribute, op, value) VALUES (@u, 'Cleartext-Password', ':=', @p)",
                    ("@u", username), ("@p", password));

                // 2. السرعة (Mikrotik-Rate-Limit)
                if (!string.IsNullOrWhiteSpace(speed))
                {
                    var rateLimit = NormalizeSpeed(speed);
                    await ExecuteNonQuery(conn,
                        "INSERT INTO radreply (username, attribute, op, value) VALUES (@u, 'Mikrotik-Rate-Limit', ':=', @s)",
                        ("@u", username), ("@s", rateLimit));
                }

                // 3. تاريخ الانتهاء (Expiration)
                if (expiration.HasValue)
                {
                    // صيغة FreeRADIUS: "25 Jul 2026 23:59:59"
                    var expStr = expiration.Value.ToString("dd MMM yyyy HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture);
                    await ExecuteNonQuery(conn,
                        "INSERT INTO radcheck (username, attribute, op, value) VALUES (@u, 'Expiration', ':=', @e)",
                        ("@u", username), ("@e", expStr));
                }

                _logger.LogInformation("✅ RADIUS: تم إنشاء المستخدم {Username}", username);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ RADIUS: فشل إنشاء المستخدم {Username}", username);
                return false;
            }
        }

        /// <summary>
        /// تفعيل المستخدم
        /// </summary>
        public async Task<bool> EnableUser(string username)
        {
            try
            {
                using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();

                // حذف أي Auth-Type := Reject
                await ExecuteNonQuery(conn,
                    "DELETE FROM radcheck WHERE username=@u AND attribute='Auth-Type'",
                    ("@u", username));

                // التأكد من وجود كلمة المرور (لا نغيرها)
                _logger.LogInformation("✅ RADIUS: تم تفعيل المستخدم {Username}", username);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ RADIUS: فشل تفعيل {Username}", username);
                return false;
            }
        }

        /// <summary>
        /// إيقاف / تعطيل المستخدم (يمنع المصادقة)
        /// </summary>
        public async Task<bool> DisableUser(string username)
        {
            try
            {
                using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();

                // حذف أي Auth-Type سابق
                await ExecuteNonQuery(conn,
                    "DELETE FROM radcheck WHERE username=@u AND attribute='Auth-Type'",
                    ("@u", username));

                // إضافة Auth-Type := Reject → يرفض المصادقة فوراً
                await ExecuteNonQuery(conn,
                    "INSERT INTO radcheck (username, attribute, op, value) VALUES (@u, 'Auth-Type', ':=', 'Reject')",
                    ("@u", username));

                _logger.LogInformation("⛔ RADIUS: تم تعطيل المستخدم {Username}", username);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ RADIUS: فشل تعطيل {Username}", username);
                return false;
            }
        }

        /// <summary>
        /// تحديث السرعة
        /// </summary>
        public async Task<bool> UpdateSpeed(string username, string speed)
        {
            try
            {
                using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();

                var rateLimit = NormalizeSpeed(speed);

                // حذف القديم ثم إضافة الجديد
                await ExecuteNonQuery(conn,
                    "DELETE FROM radreply WHERE username=@u AND attribute='Mikrotik-Rate-Limit'",
                    ("@u", username));

                await ExecuteNonQuery(conn,
                    "INSERT INTO radreply (username, attribute, op, value) VALUES (@u, 'Mikrotik-Rate-Limit', ':=', @s)",
                    ("@u", username), ("@s", rateLimit));

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ RADIUS: فشل تحديث السرعة لـ {Username}", username);
                return false;
            }
        }

        /// <summary>
        /// تحديث تاريخ الانتهاء
        /// </summary>
        public async Task<bool> UpdateExpiration(string username, DateTime expiration)
        {
            try
            {
                using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();

                await ExecuteNonQuery(conn,
                    "DELETE FROM radcheck WHERE username=@u AND attribute='Expiration'",
                    ("@u", username));

                var expStr = expiration.ToString("dd MMM yyyy HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture);
                await ExecuteNonQuery(conn,
                    "INSERT INTO radcheck (username, attribute, op, value) VALUES (@u, 'Expiration', ':=', @e)",
                    ("@u", username), ("@e", expStr));

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ RADIUS: فشل تحديث الانتهاء لـ {Username}", username);
                return false;
            }
        }

        /// <summary>
        /// حذف المستخدم نهائياً من RADIUS
        /// </summary>
        public async Task<bool> DeleteUser(string username)
        {
            try
            {
                using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();
                await DeleteUserInternal(conn, username);
                _logger.LogInformation("🗑️ RADIUS: تم حذف المستخدم {Username}", username);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ RADIUS: فشل حذف {Username}", username);
                return false;
            }
        }

        // ==================== مساعدات ====================

        private async Task DeleteUserInternal(MySqlConnection conn, string username)
        {
            await ExecuteNonQuery(conn, "DELETE FROM radcheck WHERE username=@u", ("@u", username));
            await ExecuteNonQuery(conn, "DELETE FROM radreply WHERE username=@u", ("@u", username));
            await ExecuteNonQuery(conn, "DELETE FROM radusergroup WHERE username=@u", ("@u", username));
        }

        private async Task ExecuteNonQuery(MySqlConnection conn, string sql, params (string name, object value)[] parameters)
        {
            using var cmd = new MySqlCommand(sql, conn);
            foreach (var p in parameters)
                cmd.Parameters.AddWithValue(p.name, p.value ?? DBNull.Value);
            await cmd.ExecuteNonQueryAsync();
        }

        private string NormalizeSpeed(string speed)
        {
            if (string.IsNullOrWhiteSpace(speed)) return "1M/1M";

            speed = speed.Replace("Mb/s", "M").Replace("Mbps", "M").Replace("mbps", "M").Trim();

            if (!speed.Contains("/"))
                speed = $"{speed}/{speed}";

            return speed;
        }
    }
}