using System;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ISPSystem.Data;
using Microsoft.Extensions.Logging;

namespace ISPSystem
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();

            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<AppDbContext>();
                    // åÐÇ ÇáÓØÑ íÞæã ÈÅäÔÇÁ ÇáÌÏÇæá ÈäÇÁð Úáì ÇáÜ Models ÇáÎÇÕÉ Èß
                    context.Database.EnsureCreated();
                }
                catch (Exception ex)
                {
                    Console.WriteLine("An error occurred while migrating the database: " + ex.Message);
                }
            }

            host.Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                })
                .ConfigureLogging(logging =>
                {
                    logging.ClearProviders();
                    logging.AddConsole();
                });
    }
}