using Microsoft.EntityFrameworkCore;
using ISPSystem.Models;

namespace ISPSystem.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Plan> Plans { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<TicketReply> TicketReplies { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Purchase> Purchases { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<Device> Device { get; set; }
        public DbSet<MikroTikDevice> MikroTikDevices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Client>().HasIndex(c => c.Username).IsUnique();
            modelBuilder.Entity<Client>().HasIndex(c => c.MacAddress).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<Product>().HasIndex(p => p.ModelNumber);

            modelBuilder.Entity<Product>().Property(p => p.CostPrice).HasPrecision(18, 2);
            modelBuilder.Entity<Product>().Property(p => p.SellPrice).HasPrecision(18, 2);
            modelBuilder.Entity<Purchase>().Property(p => p.CostPerUnit).HasPrecision(18, 2);
            modelBuilder.Entity<Purchase>().Property(p => p.Total).HasPrecision(18, 2);
            modelBuilder.Entity<Sale>().Property(s => s.UnitSellPrice).HasPrecision(18, 2);
            modelBuilder.Entity<Sale>().Property(s => s.Total).HasPrecision(18, 2);
        }
    }
}