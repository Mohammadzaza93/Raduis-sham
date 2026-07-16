using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ISPSystem.Data;
using ISPSystem.DTOs;
using ISPSystem.Helpers;
using ISPSystem.Models;
using ISPSystem.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ISPSystem.Controllers
{
    [ApiController]
    [Route("api/clients")]
    [Authorize]
    public class ClientsController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly AppDbContext _context;
        private readonly AuditService _audit;

        public ClientsController(UserService userService, AppDbContext context, AuditService audit)
        {
            _userService = userService;
            _context = context;
            _audit = audit;
        }

        // 📋 الحصول على جميع العملاء مع ميزة البحث والتقسيم (Pagination)
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] ClientQuery query)
        {
            // تأمين قيم افتراضية لضمان عدم حدوث خطأ تقسيم على صفر
            if (query.Page <= 0) query.Page = 1;
            if (query.PageSize <= 0) query.PageSize = 10;

            var clientsQuery = _context.Clients.AsQueryable();

            // فحص الفلترة والبحث
            if (!string.IsNullOrEmpty(query.Search))
            {
                var search = query.Search.Trim();
                clientsQuery = clientsQuery.Where(c =>
                    c.Username.Contains(search) ||
                    c.FullName.Contains(search) ||
                    c.Phone.Contains(search) ||
                    c.NationalId.Contains(search));
            }

            var total = await clientsQuery.CountAsync();

            var data = await clientsQuery
                .OrderByDescending(c => c.CreatedAt) // ترتيب منطقي لعرض الأحدث أولاً
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
                    c.NationalId,
                    // جلب معلومات الاشتراك النشط بشكل مباشر ومحمي
                    ActiveSubscription = _context.Subscriptions
                        .Where(s => s.ClientId == c.Id && s.IsActive)
                        .OrderByDescending(s => s.EndDate)
                        .Select(s => new
                        {
                            s.Id,
                            PlanName = s.Plan != null ? s.Plan.Name : "باقة غير معروفة",
                            s.EndDate,
                            s.IsActive
                        })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(new
            {
                total,
                page = query.Page,
                pageSize = query.PageSize,
                data
            }));
        }

        // ➕ إضافة عميل جديد (خاص بالمسؤولين والموظفين)
        [HttpPost]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<IActionResult> Create([FromBody] CreateClientDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("بيانات العميل غير صالحة"));

            try
            {
                var client = await _userService.CreateClient(dto);

                // إرجاع البيانات المجهزة للعرض في الـ Frontend
                return Ok(ApiResponse<object>.Ok(new
                {
                    client = new
                    {
                        client.Id,
                        client.Username,
                        client.FullName,
                        client.Phone,
                        client.Email,
                        client.MacAddress,
                        client.IpAddress,
                        client.NationalId,
                        Password = client.Password // لعرضها مرة واحدة عند الإنشاء
                    },
                    message = "تم إنشاء العميل بنجاح"
                }));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
        }

        // 🔄 تحديث بيانات العميل وإعدادات الشبكة الخاصة به
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateClientDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("البيانات المرسلة فارغة"));

            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            // تحديث الحقول الأساسية
            client.FullName = dto.FullName;
            client.Phone = dto.Phone;
            client.Email = dto.Email;
            client.Address = dto.Address;

            // تحديث إعدادات الشبكة إذا كانت ممررة في الـ DTO الموحد
            if (!string.IsNullOrEmpty(dto.MacAddress)) client.MacAddress = dto.MacAddress;
            if (!string.IsNullOrEmpty(dto.IpAddress)) client.IpAddress = dto.IpAddress;

            await _context.SaveChangesAsync();
            await _audit.Log("Update", "Client", id);

            return Ok(ApiResponse<Client>.Ok(client));
        }

        // 🔍 الحصول على عميل محدد بواسطة الـ ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = await _userService.GetClientById(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            return Ok(ApiResponse<object>.Ok(client));
        }

        // ❌ حذف عميل من النظام نهائياً (صلاحية Admin فقط)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();
            await _audit.Log("Delete", "Client", id);

            return Ok(ApiResponse<string>.Ok("تم حذف العميل بنجاح"));
        }
    }
}