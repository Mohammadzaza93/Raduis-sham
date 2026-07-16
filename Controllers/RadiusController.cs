// backend/Controllers/RadiusController.cs
using Microsoft.AspNetCore.Mvc;
using ISPSystem.Services;
using ISPSystem.Models;
using ISPSystem.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace ISPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RadiusController : ControllerBase
    {
        private readonly RadiusClientService _radiusClient;
        private readonly ILogger<RadiusController> _logger;

        public RadiusController(RadiusClientService radiusClient, ILogger<RadiusController> logger)
        {
            _radiusClient = radiusClient;
            _logger = logger;
        }

        // POST: api/radius/authenticate
        [HttpPost("authenticate")]
        [AllowAnonymous]
        public async Task<IActionResult> Authenticate([FromBody] RadiusAuthenticateDto dto)
        {
            if (string.IsNullOrEmpty(dto.Username) || string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            try
            {
                var response = await _radiusClient.AuthenticateAsync(
                    dto.Username,
                    dto.Password,
                    dto.NasIp,
                    dto.MacAddress
                );

                return Ok(new
                {
                    success = response.Success,
                    code = response.Code,
                    message = response.Message,
                    attributes = response.Attributes
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"RADIUS authentication error: {ex.Message}");
                return StatusCode(500, new { message = "RADIUS server error", error = ex.Message });
            }
        }

        // POST: api/radius/test
        [HttpPost("test")]
        public async Task<IActionResult> TestConnection()
        {
            try
            {
                // «Œ »«— «·« ’«· »«” Œœ«„ „” Œœ„  Ã—Ì»Ì
                var response = await _radiusClient.AuthenticateAsync("test", "test123");
                return Ok(new
                {
                    connected = true,
                    server = "192.168.1.121",
                    port = 1812,
                    response = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    connected = false,
                    error = ex.Message,
                    server = "192.168.1.121",
                    port = 1812
                });
            }
        }
    }
}