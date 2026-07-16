using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using ISPSystem.Data;
using ISPSystem.Services;

namespace ISPSystem.Services
{
    public class ExpirationService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public ExpirationService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();

                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var radius = scope.ServiceProvider.GetRequiredService<RadiusService>();

                var expired = db.Subscriptions
                    .Where(x => x.EndDate < DateTime.Now && x.IsActive)
                    .ToList();

                foreach (var sub in expired)
                {
                    sub.IsActive = false;
                    sub.Status = "Expired";

                    var client = db.Clients.FirstOrDefault(c => c.Id == sub.ClientId);

                    if (client != null)
                    {
                        await radius.DisableUser(client.Username);
                    }
                }

                await db.SaveChangesAsync();

                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
        }
    }
}