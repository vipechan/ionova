# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

**Note:** Ionova is currently in active development. Once we reach mainnet (v1.0.0), we will maintain security updates for the latest major version and the previous major version.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### Preferred Method: Private Email

Send an email to **security@ionova.network** with:

1. **Subject:** `[SECURITY] Brief description`
2. **Description:** Detailed description of the vulnerability
3. **Impact:** What an attacker could achieve
4. **Steps to Reproduce:** Clear steps to reproduce the issue
5. **Proof of Concept:** Code, screenshots, or video (if applicable)
6. **Suggested Fix:** If you have ideas for remediation
7. **Contact Info:** How we can reach you for follow-up

### Alternative: GitHub Security Advisories

You can also report vulnerabilities using [GitHub's private vulnerability reporting](https://github.com/vipechan/ionova/security/advisories/new).

## Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** 
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: Best effort

## Bug Bounty Program

We offer rewards for responsibly disclosed security vulnerabilities:

### Reward Tiers

| Severity | Description | Reward Range |
|----------|-------------|--------------|
| **Critical** | Remote code execution, private key theft, consensus bypass, unlimited token minting | $10,000 - $50,000 |
| **High** | Authentication bypass, privilege escalation, smart contract exploits leading to fund loss | $5,000 - $10,000 |
| **Medium** | Information disclosure, DoS attacks, logic errors in non-critical contracts | $1,000 - $5,000 |
| **Low** | Minor security issues with limited impact | $100 - $1,000 |

### Scope

**In Scope:**
- Rust node implementation (`node/`)
- Smart contracts (`contracts/`)
- SDK (`sdk/`)
- DevNet configuration (`devnet/`)
- Consensus mechanism
- Cryptographic implementations
- Authentication and authorization
- Data validation and sanitization

**Out of Scope:**
- Social engineering attacks
- Physical attacks
- DoS attacks requiring significant resources
- Issues in third-party dependencies (report to the dependency maintainers)
- Issues in the frontend website (unless they lead to critical vulnerabilities)
- Theoretical vulnerabilities without proof of concept

### Eligibility

To be eligible for a bounty:

1. **First Reporter:** You must be the first to report the vulnerability
2. **Responsible Disclosure:** Follow our disclosure timeline
3. **No Public Disclosure:** Do not disclose publicly until we've issued a fix
4. **No Exploitation:** Do not exploit the vulnerability beyond proof of concept
5. **Quality Report:** Provide sufficient detail for us to reproduce and fix

### Disclosure Timeline

1. **Report:** Submit vulnerability privately
2. **Acknowledgment:** We confirm receipt (48 hours)
3. **Investigation:** We investigate and validate (7 days)
4. **Fix Development:** We develop and test a fix
5. **Coordinated Disclosure:** We coordinate public disclosure with you
6. **Bounty Payment:** We process your reward (within 30 days of fix deployment)

## Security Best Practices

### For Developers

- **Code Review:** All code must be reviewed by at least one other developer
- **Testing:** Write comprehensive tests including edge cases
- **Dependencies:** Keep dependencies up to date
- **Secrets:** Never commit secrets, keys, or passwords
- **Input Validation:** Validate and sanitize all inputs
- **Error Handling:** Handle errors gracefully without exposing sensitive info

### For Node Operators

- **Keep Updated:** Always run the latest stable version
- **Secure Keys:** Use hardware wallets or secure key management
- **Firewall:** Restrict access to necessary ports only
- **Monitoring:** Monitor for unusual activity
- **Backups:** Regular backups of validator keys and data

### For Smart Contract Developers

- **Audits:** Get contracts audited before mainnet deployment
- **Testing:** Comprehensive test coverage (>95%)
- **Upgradability:** Consider upgrade mechanisms carefully
- **Access Control:** Implement proper role-based access control
- **Reentrancy:** Protect against reentrancy attacks
- **Integer Overflow:** Use SafeMath or Solidity 0.8+

## Security Audits

We conduct regular security audits:

- **Internal Reviews:** Continuous code review by core team
- **External Audits:** Third-party audits before major releases
- **Bug Bounty:** Ongoing community-driven security testing
- **Penetration Testing:** Regular penetration testing of infrastructure

## Past Security Advisories

We will publish security advisories for all fixed vulnerabilities:

- [GitHub Security Advisories](https://github.com/vipechan/ionova/security/advisories)

## Contact

- **Security Email:** security@ionova.network
- **PGP Key:** [Available on request]
- **Response Time:** 48 hours maximum

## Recognition

We maintain a [Security Hall of Fame](https://github.com/vipechan/ionova/blob/master/SECURITY_HALL_OF_FAME.md) to recognize security researchers who help make Ionova more secure.

---

**Thank you for helping keep Ionova and our community safe!**
