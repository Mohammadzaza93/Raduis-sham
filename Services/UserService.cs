using System;
using System.Linq;
using System.Threading.Tasks;
using ISPSystem.Data;
using ISPSystem.Models;
using ISPSystem.DTOs;
using Microsoft.EntityFrameworkCore;
using ISPSystem.Helpers;

namespace ISPSystem.Services
{
    public class UserService
    {
        private readonly AppDbContext _context;
        private readonly PasswordService _password;
        private readonly AuditService _audit;
        private readonly RadiusService _radius;
        private readonly MikroTikService _mikroTik;

        public UserService(AppDbContext context, PasswordService password, AuditService audit, RadiusService radius, MikroTikService mikroTik)
        {
            _context = context;
            _password = password;
            _audit = audit;
            _radius = radius;
            _mikroTik = mikroTik;
        }

        // ============= طرق الموظفين (Users) =============

        public async Task<object> GetAll(UserQuery query)
        {
            var users = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(query.Search))
            {
                users = users.Where(x =>
                    x.Username.Contains(query.Search) ||
                    x.FullName.Contains(query.Search));
            }

            var total = await users.CountAsync();

            var data = await users
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FullName,
                    u.Phone,
                    u.Email,
                    u.Role,
                    u.Status,
                    u.CreatedAt,
                    u.LastLogin
                })
                .ToListAsync();

            return new
            {
                total,
                page = query.Page,
                pageSize = query.PageSize,
                data
            };
        }

        public async Task<User> GetById(int id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<User> Create(CreateUserDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                throw new Exception("اسم المستخدم موجود بالفعل");

            var user = new User
            {
                Username = dto.Username,
                Password = _password.Hash(dto.Password),
                FullName = dto.FullName,
                Phone = dto.Phone,
                Email = dto.Email,
                Role = dto.Role,
                Status = "Active",
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            await _audit.Log("Create", "User", user.Id);

            return user;
        }

        public async Task<User> Update(int id, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;

            user.FullName = dto.FullName;
            user.Phone = dto.Phone;
            user.Email = dto.Email;
            user.Role = dto.Role;

            await _context.SaveChangesAsync();
            await _audit.Log("Update", "User", user.Id);

            return user;
        }

        public async Task<bool> Delete(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            await _audit.Log("Delete", "User", user.Id);
            return true;
        }

        // ============= طرق العملاء (Clients) =============

        public object GetAllClients(ClientQuery query)
        {
            var clients = _context.Clients.AsQueryable();

            if (!string.IsNullOrEmpty(query.Search))
            {
                clients = clients.Where(c =>
                    c.Username.Contains(query.Search) ||
                    c.FullName.Contains(query.Search) ||
                    c.Phone.Contains(query.Search) ||
                    c.NationalId.Contains(query.Search));
            }

            if (!string.IsNullOrEmpty(query.Status))
            {
                clients = clients.Where(c => c.Status == query.Status);
            }

            var total = clients.Count();

            var data = clients
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(c => new
                {
                    c.Id,
                    c.Username,
                    c.FullName,
                    c.Phone,
                    c.Email,
                    c.MacAddress,
                    c.IpAddress,
                    c.Status,
                    c.CreatedAt,
                    c.NationalId
                })
                .ToList();

            return new
            {
                total,
                page = query.Page,
                pageSize = query.PageSize,
                data
            };
        }

        public async Task<Client> GetClientById(int id)
        {
            return await _context.Clients
                .Include(c => c.Subscriptions)
                .ThenInclude(s => s.Plan)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        // ========== 🔥 الطريقة الرئيسية: إنشاء عميل مع إضافته إلى MikroTik و Radius ==========
        // ========== 🔥 إنشاء عميل مع RADIUS كمسؤول رئيسي ==========
        public async Task<Client> CreateClient(CreateClientDto dto)
        {
            if (string.IsNullOrEmpty(dto.NationalId))
                throw new Exception("الرقم الوطني مطلوب");

            if (string.IsNullOrEmpty(dto.FullName))
                throw new Exception("الاسم الكامل مطلوب");

            if (string.IsNullOrEmpty(dto.Phone))
                throw new Exception("رقم الهاتف مطلوب");

            if (dto.PlanId <= 0)
                throw new Exception("يجب اختيار باقة صحيحة");

            var plan = await _context.Plans.FindAsync(dto.PlanId);
            if (plan == null)
                throw new Exception("الخطة غير موجودة");

            var existingCount = await _context.Clients
                .Where(c => c.NationalId == dto.NationalId)
                .CountAsync();

            var sequence = existingCount + 1;
            var username = $"{dto.NationalId}-{sequence}@sham.net";
            var plainPassword = RandomPasswordService.GeneratePassword(5);
            var hashedPassword = _password.Hash(plainPassword);

            var endDate = DateTime.Now.AddDays(plan.DurationDays);

            var client = new Client
            {
                Username = username,
                Password = hashedPassword,
                FullName = dto.FullName,
                Phone = dto.Phone,
                Email = username,
                NationalId = dto.NationalId,
                Address = dto.Address ?? "",
                Status = "Active",
                CreatedAt = DateTime.Now,
                MacAddress = RandomPasswordService.GenerateRandomMacAddress(),
                IpAddress = RandomPasswordService.GenerateRandomIpAddress()
            };

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. حفظ العميل
                _context.Clients.Add(client);
                await _context.SaveChangesAsync();

                // 2. إنشاء الاشتراك
                var subscription = new Subscription
                {
                    ClientId = client.Id,
                    PlanId = plan.Id,
                    StartDate = DateTime.Now,
                    EndDate = endDate,
                    IsActive = true,
                    Status = "Active",
                    PaidAmount = plan.Price
                };
                _context.Subscriptions.Add(subscription);
                await _context.SaveChangesAsync();

                // 3. إنشاء الفاتورة
                var invoice = new Invoice
                {
                    InvoiceNumber = GenerateInvoiceNumber(),
                    ClientId = client.Id,
                    SubscriptionId = subscription.Id,
                    SubTotal = plan.Price,
                    Tax = 0,
                    Discount = 0,
                    Total = plan.Price,
                    Date = DateTime.Now,
                    DueDate = DateTime.Now.AddDays(7),
                    IsPaid = true,
                    PaidAt = DateTime.Now,
                    Status = "Paid"
                };
                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                // 4. إنشاء الدفعة
                var payment = new Payment
                {
                    ClientId = client.Id,
                    SubscriptionId = subscription.Id,
                    InvoiceId = invoice.Id,
                    Amount = plan.Price,
                    Date = DateTime.Now,
                    PaymentMethod = dto.PaymentMethod ?? "Cash",
                    Status = "Completed"
                };
                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                await _audit.Log("Create", "Client", client.Id);

                // ========== 🟢 RADIUS (المسؤول الرئيسي) ==========
                try
                {
                    string radiusSpeed = plan.Speed?
                        .Replace("Mb/s", "M")
                        .Replace("Mbps", "M")
                        .Trim() ?? "1M/1M";

                    if (!radiusSpeed.Contains("/"))
                        radiusSpeed = $"{radiusSpeed}/{radiusSpeed}";

                    // إنشاء المستخدم في RADIUS مع تاريخ الانتهاء
                    bool radiusResult = await _radius.CreateUser(
                        client.Username,
                        plainPassword,
                        radiusSpeed,
                        endDate   // ← تاريخ انتهاء الاشتراك
                    );

                    if (radiusResult)
                        Console.WriteLine($"✅ RADIUS: تم إنشاء {client.Username} بنجاح (ينتهي: {endDate:yyyy-MM-dd})");
                    else
                        Console.WriteLine($"⚠️ RADIUS: فشل إنشاء {client.Username}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ خطأ RADIUS: {ex.Message}");
                }

                // ========== 🟡 MikroTik (اختياري - Dual Write) ==========
                try
                {
                    bool mikrotikResult = await _mikroTik.AddPppUser(
                        client.Username,
                        plainPassword,
                        plan.Name,
                        client.FullName
                    );

                    if (mikrotikResult)
                        Console.WriteLine($"✅ MikroTik: تم إضافة {client.Username}");
                    else
                        Console.WriteLine($"⚠️ MikroTik: فشل إضافة {client.Username}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ خطأ MikroTik: {ex.Message}");
                }

                // إرجاع كلمة المرور العادية (مرة واحدة)
                client.Password = plainPassword;
                return client;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"❌ فشل إنشاء العميل: {ex.Message}");
                throw new Exception($"فشل إنشاء العميل: {ex.Message}");
            }
        }

        // تحديث معلومات الشبكة للعميل
        public async Task<bool> UpdateClientNetworkInfo(int clientId, string macAddress, string ipAddress)
        {
            var client = await _context.Clients.FindAsync(clientId);
            if (client == null)
                return false;

            if (!string.IsNullOrEmpty(macAddress))
                client.MacAddress = macAddress;

            if (!string.IsNullOrEmpty(ipAddress))
                client.IpAddress = ipAddress;

            await _context.SaveChangesAsync();
            return true;
        }

        // حذف عميل
        public async Task<bool> DeleteClient(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null) return false;

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();
            await _audit.Log("Delete", "Client", id);
            return true;
        }

        private string GenerateInvoiceNumber()
        {
            var year = DateTime.Now.Year;
            var month = DateTime.Now.Month;
            var count = _context.Invoices.Count() + 1;
            return $"INV-{year}{month:D2}-{count:D6}";
        }
    }
}