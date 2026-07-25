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
        private readonly RadiusService _radius;

        public ClientsController(
            UserService userService,
            AppDbContext context,
            AuditService audit,
            RadiusService radius)
        {
            _userService = userService;
            _context = context;
            _audit = audit;
            _radius = radius;
        }

        // 📋 الحصول على جميع العملاء مع البحث والتقسيم
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] ClientQuery query)
        {
            if (query.Page <= 0) query.Page = 1;
            if (query.PageSize <= 0) query.PageSize = 10;

            var clientsQuery = _context.Clients.AsQueryable();

            if (!string.IsNullOrEmpty(query.Search))
            {
                var search = query.Search.Trim();
                clientsQuery = clientsQuery.Where(c =>
                    c.Username.Contains(search) ||
                    c.FullName.Contains(search) ||
                    c.Phone.Contains(search) ||
                    c.NationalId.Contains(search));
            }

            if (!string.IsNullOrEmpty(query.Status))
            {
                clientsQuery = clientsQuery.Where(c => c.Status == query.Status);
            }

            var total = await clientsQuery.CountAsync();

            var data = await clientsQuery
                .OrderByDescending(c => c.CreatedAt)
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
                    ActiveSubscription = _context.Subscriptions
                        .Where(s => s.ClientId == c.Id && s.IsActive)
                        .OrderByDescending(s => s.EndDate)
                        .Select(s => new
                        {
                            s.Id,
                            PlanName = s.Plan != null ? s.Plan.Name : "باقة غير معروفة",
                            s.EndDate,
                            s.IsActive,
                            DaysRemaining = (s.EndDate - DateTime.Now).Days
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

        // 🔍 الحصول على عميل محدد
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = await _userService.GetClientById(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            return Ok(ApiResponse<object>.Ok(client));
        }

        // ➕ إضافة عميل جديد
        [HttpPost]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<IActionResult> Create([FromBody] CreateClientDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("بيانات العميل غير صالحة"));

            try
            {
                var client = await _userService.CreateClient(dto);

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
                        client.Status,
                        Password = client.Password // تُعرض مرة واحدة فقط
                    },
                    message = "تم إنشاء العميل بنجاح وإضافته إلى RADIUS"
                }));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
        }

        // 🔄 تحديث بيانات العميل
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateClientDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("البيانات المرسلة فارغة"));

            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            client.FullName = dto.FullName;
            client.Phone = dto.Phone;
            client.Email = dto.Email;
            client.Address = dto.Address;

            if (!string.IsNullOrEmpty(dto.MacAddress))
                client.MacAddress = dto.MacAddress;

            if (!string.IsNullOrEmpty(dto.IpAddress))
                client.IpAddress = dto.IpAddress;

            await _context.SaveChangesAsync();
            await _audit.Log("Update", "Client", id);

            return Ok(ApiResponse<object>.Ok(client, "تم تحديث بيانات العميل بنجاح"));
        }

        // ⛔ إيقاف العميل (Suspend)
        [HttpPost("{id}/suspend")]
        [Authorize(Roles = "Admin,Support,Employee")]
        public async Task<IActionResult> Suspend(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            if (client.Status == "Suspended")
                return BadRequest(ApiResponse<string>.Fail("العميل موقوف بالفعل"));

            client.Status = "Suspended";
            await _context.SaveChangesAsync();

            // تعطيل في RADIUS (المسؤول الرئيسي عن الاتصال)
            var radiusOk = await _radius.DisableUser(client.Username);

            await _audit.Log("Suspend", "Client", id);

            return Ok(ApiResponse<object>.Ok(new
            {
                clientId = id,
                status = "Suspended",
                radiusDisabled = radiusOk,
                message = "تم إيقاف العميل بنجاح"
            }));
        }

        // ▶️ تفعيل العميل (Activate)
        [HttpPost("{id}/activate")]
        [Authorize(Roles = "Admin,Support,Employee")]
        public async Task<IActionResult> Activate(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            if (client.Status == "Active")
                return BadRequest(ApiResponse<string>.Fail("العميل مفعّل بالفعل"));

            // التحقق من وجود اشتراك نشط
            var hasActiveSub = await _context.Subscriptions
                .AnyAsync(s => s.ClientId == id && s.IsActive && s.EndDate > DateTime.Now);

            if (!hasActiveSub)
                return BadRequest(ApiResponse<string>.Fail("لا يمكن تفعيل العميل لأنه لا يملك اشتراكاً نشطاً"));

            client.Status = "Active";
            await _context.SaveChangesAsync();

            // تفعيل في RADIUS
            var radiusOk = await _radius.EnableUser(client.Username);

            await _audit.Log("Activate", "Client", id);

            return Ok(ApiResponse<object>.Ok(new
            {
                clientId = id,
                status = "Active",
                radiusEnabled = radiusOk,
                message = "تم تفعيل العميل بنجاح"
            }));
        }

        // ❌ حذف بسيط (من قاعدة البيانات فقط - للتوافق)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            // تعطيل في RADIUS أولاً
            await _radius.DisableUser(client.Username);

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();
            await _audit.Log("Delete", "Client", id);

            return Ok(ApiResponse<string>.Ok("تم حذف العميل بنجاح"));
        }

        // 🗑️ حذف نهائي (من النظام + RADIUS)
        [HttpDelete("{id}/permanent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePermanent(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            var username = client.Username;

            // 1. حذف من RADIUS نهائياً
            var radiusDeleted = await _radius.DeleteUser(username);

            // 2. حذف الاشتراكات المرتبطة
            var subscriptions = _context.Subscriptions.Where(s => s.ClientId == id);
            _context.Subscriptions.RemoveRange(subscriptions);

            // 3. حذف العميل من قاعدة البيانات
            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();

            await _audit.Log("DeletePermanent", "Client", id);

            return Ok(ApiResponse<object>.Ok(new
            {
                message = "تم حذف العميل نهائياً من النظام وRADIUS",
                radiusDeleted
            }));
        }
    }
}