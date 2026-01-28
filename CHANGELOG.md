# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-28

### Added
- Initial release of QQ Bot channel plugin
- Webhook-based event receiving (WebSocket deprecated by QQ official)
- Support for DM, Group, Guild, and Guild DM chats
- Rich media message support (text, images, markdown, embeds)
- Passive reply mode for bypassing group message limits
- Ed25519 signature verification for webhooks
- Access token auto-refresh mechanism
- Multi-account support
- DM access control policies (open, pairing, allowlist)
- Group mention requirement configuration
- CLI onboarding wizard
- Complete TypeScript type definitions

### Security
- Ed25519 webhook signature verification
- Secure token storage and refresh
- DM access control with pairing/allowlist modes

### Documentation
- Comprehensive README with installation and usage guide
- Configuration examples for single and multi-account setups
- API reference and troubleshooting guide
- Contributing guidelines

[1.0.0]: https://github.com/YOUR_USERNAME/moltbot-plugin-qqbot/releases/tag/v1.0.0
