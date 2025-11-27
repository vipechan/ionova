# Contributing to Ionova

Thank you for your interest in contributing to Ionova!

## Ways to Contribute

### 1. Code Contributions

**Areas:**
- Core blockchain (Rust)
- Smart contracts (Solidity)
- SDK (JavaScript/TypeScript)
- Frontend (React)
- Documentation

**Process:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 2. Bug Reports

**Before submitting:**
- Check existing issues
- Use the bug report template
- Include steps to reproduce
- Specify environment (OS, Rust version, etc.)

### 3. Feature Requests

**Use cases we're looking for:**
- DeFi protocols
- Developer tools
- Infrastructure improvements
- UX enhancements

### 4. Documentation

Help improve our docs:
- Fix typos
- Add examples
- Clarify explanations
- Translate to other languages

## Development Setup

```bash
# Clone repo
git clone https://github.com/ionova-network/ionova.git
cd ionova

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build node
cd node
cargo build --release

# Run tests
cargo test

# Start devnet
cd ../devnet
docker compose up -d
```

## Coding Standards

### Rust
- Follow official Rust style guide
- Run `cargo fmt` before committing
- Run `cargo clippy` and fix warnings
- Add tests for new features

### Solidity
- Use Solidity 0.8+
- Follow OpenZeppelin patterns
- Add NatSpec comments
- Write comprehensive tests

### JavaScript
- Use ESLint recommended config
- Prefer async/await over promises
- Add JSDoc comments
- Test with Jest

## Pull Request Guidelines

**Title:**
- Use prefix: `feat:`, `fix:`, `docs:`, `refactor:`
- Be descriptive: `feat: add liquid staking APY calculator`

**Description:**
- What does this PR do?
- Why is this change needed?
- Any breaking changes?
- Screenshots (if UI change)

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests pass
- [ ] No merge conflicts

## Rewards

**Developer Grants:** Up to $100,000 for major contributions

**Bug Bounties:**
- Critical: $10,000 - $50,000
- High: $5,000 - $10,000
- Medium: $1,000 - $5,000
- Low: $100 - $1,000

**Fee Sharing:** Top contributors get % of protocol fees

## Code of Conduct

- Be respectful and inclusive
- No harassment or discrimination
- Constructive feedback only
- Help newcomers

## Questions?

- Discord: #dev-support channel
- Email: devs@ionova.network
- GitHub Discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
