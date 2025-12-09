# 📦 Package Publishing Guide

**Publishing Ionova Ecosystem Packages**

Date: 2025-12-09  
Packages: 4 (npm x2, crates.io, PyPI)

---

## 📋 **CHECKLIST**

- [ ] @ionova/wallet-sdk → npm
- [ ] @ionova/cli → npm
- [ ] ionova-sdk → crates.io
- [ ] ionova-sdk → PyPI

---

## 1. NPM: @ionova/wallet-sdk

### Pre-publish Checklist
```bash
cd sdk/wallet-sdk

# 1. Build the package
npm run build

# 2. Test locally
npm test

# 3. Check package contents
npm pack --dry-run

# 4. Verify package.json
# - name: "@ionova/wallet-sdk"
# - version: "1.0.0"
# - main: "dist/index.js"
# - types: "dist/index.d.ts"
```

### Publishing
```bash
# Login to npm
npm login

# Publish (first time)
npm publish --access public

# Or update version
npm version patch  # 1.0.0 -> 1.0.1
npm publish
```

### Post-publish
```bash
# Test installation
npm install @ionova/wallet-sdk

# Verify in another project
mkdir test-project
cd test-project
npm init -y
npm install @ionova/wallet-sdk
```

---

## 2. NPM: @ionova/cli

### Pre-publish Checklist
```bash
cd cli

# 1. Build
npm run build

# 2. Test CLI locally
npm link
ionova --version
ionova wallet:create --help

# 3. Verify binary works
node dist/index.js wallet:list

# 4. Check package.json bin field
#    "bin": { "ionova": "./dist/index.js" }
```

### Publishing
```bash
npm login
npm publish --access public
```

### Post-publish
```bash
# Global install test
npm install -g @ionova/cli
ionova --version
ionova wallet:create
```

---

## 3. CRATES.IO: ionova-sdk

### Pre-publish Checklist
```bash
cd sdk/rust-sdk

# 1. Login to crates.io
cargo login <YOUR_API_TOKEN>

# 2. Build and test
cargo build --release
cargo test

# 3. Check package
cargo package --list

# 4. Verify Cargo.toml
# - name = "ionova-sdk"
# - version = "1.0.0"
# - license = "MIT"
# - repository, description filled
```

### Publishing
```bash
# Dry run first
cargo publish --dry-run

# Actually publish
cargo publish
```

### Post-publish
```bash
# Test installation
cargo new test-project
cd test-project
cargo add ionova-sdk
cargo build
```

---

## 4. PYPI: ionova-sdk

### Pre-publish Checklist
```bash
cd sdk/python-sdk

# 1. Install build tools
pip install build twine

# 2. Build package
python -m build

# 3. Check dist/
ls dist/
# Should see:
# - ionova_sdk-1.0.0-py3-none-any.whl
# - ionova_sdk-1.0.0.tar.gz

# 4. Test locally
pip install dist/ionova_sdk-1.0.0-py3-none-any.whl
python -c "from ionova import IonovaWallet; print('OK')"
```

### Publishing
```bash
# Upload to TestPyPI first
twine upload --repository testpypi dist/*

# Test from TestPyPI
pip install --index-url https://test.pypi.org/simple/ ionova-sdk

# If good, upload to real PyPI
twine upload dist/*
```

### Post-publish
```bash
# Test installation
pip install ionova-sdk

# Verify
python -c "from ionova import IonovaWallet, RpcClient; print('Success!')"
```

---

## 📊 **VERIFICATION MATRIX**

| Package | Registry | Install Command | Version Check |
|---------|----------|-----------------|---------------|
| wallet-sdk | npm | `npm i @ionova/wallet-sdk` | Check package.json |
| cli | npm | `npm i -g @ionova/cli` | `ionova --version` |
| rust-sdk | crates.io | `cargo add ionova-sdk` | Check Cargo.toml |
| python-sdk | PyPI | `pip install ionova-sdk` | `pip show ionova-sdk` |

---

## 🔧 **TROUBLESHOOTING**

### NPM Issues
**Error: Package name already taken**
```bash
# Use scoped package
# Change to: @your-org/ionova-wallet-sdk
```

**Error: 403 Forbidden**
```bash
# Re-login
npm logout
npm login
```

### Crates.io Issues
**Error: Failed to authenticate**
```bash
# Get new token from https://crates.io/settings/tokens
cargo login <TOKEN>
```

### PyPI Issues
**Error: Invalid distribution**
```bash
# Clean and rebuild
rm -rf dist/
python -m build
```

---

## 📝 **POST-PUBLISH TASKS**

### Update Documentation
- [ ] Add installation badges to README
- [ ] Update main README.md with npm/crates/pypi links
- [ ] Create CHANGELOG.md for each package
- [ ] Tag GitHub releases

### Announce
- [ ] Tweet from @ionova_network
- [ ] Post on Reddit r/cryptocurrency
- [ ] DevTo article
- [ ] Discord announcement
- [ ] Developer forums

### Monitor
- [ ] Check download stats
- [ ] Monitor issue trackers
- [ ] Respond to questions
- [ ] Collect feedback

---

## 🎯 **SUCCESS CRITERIA**

✅ All 4 packages published  
✅ Installation works without errors  
✅ Documentation is accurate  
✅ Examples run successfully  
✅ Version numbers consistent  
✅ Licenses included  
✅ No security warnings  

---

## 📞 **SUPPORT**

If issues arise:
1. Check package registry status pages
2. Review build logs carefully
3. Test in clean environment
4. Ask in package-specific communities

**Ready to publish!** 🚀
