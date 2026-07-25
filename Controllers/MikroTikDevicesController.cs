using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ISPSystem.Models;
using ISPSystem.Services;
using ISPSystem.Helpers;
using System;
using System.Threading.Tasks;

namespace ISPSystem.Controllers
{
    [ApiController]
    [Route("api/mikrotik-devices")]
    [Authorize]
    public class MikroTikDevicesController : ControllerBase
    {
        private readonly MikroTikDeviceService _service;

        public MikroTikDevicesController(MikroTikDeviceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var devices = await _service.GetAll();
            return Ok(ApiResponse<object>.Ok(devices));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var device = await _service.GetById(id);
            if (device == null)
                return NotFound(ApiResponse<string>.Fail("«·ÃÂ«“ €Ì— „ÊÃÊœ"));

            return Ok(ApiResponse<object>.Ok(device));
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] MikroTikDevice device)
        {
            if (string.IsNullOrWhiteSpace(device.Name) || string.IsNullOrWhiteSpace(device.IpAddress))
                return BadRequest(ApiResponse<string>.Fail("«·«”„ Ê⁄‰Ê«‰ IP „ÿ·Ê»«‰"));

            var result = await _service.Create(device);
            return Ok(ApiResponse<object>.Ok(result, " „ ≈÷«›… «·ÃÂ«“ »‰Ã«Õ"));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] MikroTikDevice dto)
        {
            var result = await _service.Update(id, dto);
            if (result == null)
                return NotFound(ApiResponse<string>.Fail("«·ÃÂ«“ €Ì— „ÊÃÊœ"));

            return Ok(ApiResponse<object>.Ok(result, " „ «· ÕœÌÀ »‰Ã«Õ"));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.Delete(id);
            if (!result)
                return NotFound(ApiResponse<string>.Fail("«·ÃÂ«“ €Ì— „ÊÃÊœ"));

            return Ok(ApiResponse<string>.Ok(" „ Õ–› «·ÃÂ«“ »‰Ã«Õ"));
        }

        /// <summary>
        /// ›Õ’ Õ«·… ÃÂ«“ Ê«Õœ
        /// </summary>
        [HttpPost("{id}/check")]
        public async Task<IActionResult> CheckConnection(int id)
        {
            var device = await _service.CheckConnection(id);
            if (device == null)
                return NotFound(ApiResponse<string>.Fail("«·ÃÂ«“ €Ì— „ÊÃÊœ"));

            return Ok(ApiResponse<object>.Ok(new
            {
                device.Id,
                device.Name,
                device.IsOnline,
                device.LastCheckedAt,
                device.LastError
            }));
        }

        /// <summary>
        /// ›Õ’ Ã„Ì⁄ «·√ÃÂ“…
        /// </summary>
        [HttpPost("check-all")]
        public async Task<IActionResult> CheckAll()
        {
            var devices = await _service.CheckAllConnections();
            return Ok(ApiResponse<object>.Ok(devices));
        }
    }
}