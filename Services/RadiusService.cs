using MySql.Data.MySqlClient;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System;

public class RadiusService
{
    private readonly string _connectionString;

    public RadiusService(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("RadiusConnection");
    }

    // ����� CreateUser ������ bool
    public async Task<bool> CreateUser(string username, string password, string speed)
    {
        try
        {
            using var conn = new MySqlConnection(_connectionString);
            await conn.OpenAsync();

            // ������ ��� �������� ��� ��� �������
            await DeleteUser(username);

            // ����� �������� ��� radcheck
            var cmd1 = new MySqlCommand(
                "INSERT INTO radcheck (username, attribute, op, value) VALUES (@u,'Cleartext-Password',':=',@p)",
                conn);
            cmd1.Parameters.AddWithValue("@u", username);
            cmd1.Parameters.AddWithValue("@p", password);
            await cmd1.ExecuteNonQueryAsync();

            // ����� ������ ��� radreply
            var cmd2 = new MySqlCommand(
                "INSERT INTO radreply (username, attribute, op, value) VALUES (@u,'Mikrotik-Rate-Limit',':=',@s)",
                conn);
            cmd2.Parameters.AddWithValue("@u", username);
            cmd2.Parameters.AddWithValue("@s", speed);
            await cmd2.ExecuteNonQueryAsync();

            return true;  // �� ��� �� ����� �������� �����
        }
        catch (Exception)
        {
            return false;  // �� ��� ���� �� ���
        }
    }

    public async Task DeleteUser(string username)
    {
        using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        var cmd1 = new MySqlCommand("DELETE FROM radcheck WHERE username=@u", conn);
        cmd1.Parameters.AddWithValue("@u", username);
        await cmd1.ExecuteNonQueryAsync();

        var cmd2 = new MySqlCommand("DELETE FROM radreply WHERE username=@u", conn);
        cmd2.Parameters.AddWithValue("@u", username);
        await cmd2.ExecuteNonQueryAsync();
    }

    public async Task UpdateSpeed(string username, string speed)
    {
        using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        var cmd = new MySqlCommand(
            "UPDATE radreply SET value=@s WHERE username=@u AND attribute='Mikrotik-Rate-Limit'",
            conn);

        cmd.Parameters.AddWithValue("@u", username);
        cmd.Parameters.AddWithValue("@s", speed);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DisableUser(string username)
    {
        using var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync();

        var cmd = new MySqlCommand(
            "UPDATE radcheck SET value='disabled' WHERE username=@u",
            conn);

        cmd.Parameters.AddWithValue("@u", username);
        await cmd.ExecuteNonQueryAsync();
    }
}