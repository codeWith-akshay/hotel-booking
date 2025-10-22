# 🚀 Quick Start: PNPM Setup

Fast track guide to get started with pnpm in this project.

---

## ⚡ 1-Minute Setup

```bash
# 1. Install pnpm globally (if not installed)
npm install -g pnpm

# 2. Remove old npm files
rm -rf node_modules package-lock.json
# Windows: Remove-Item -Recurse -Force node_modules; Remove-Item -Force package-lock.json

# 3. Install dependencies
pnpm install

# 4. Start development
pnpm dev
```

---

## 📝 Common Commands

### **Daily Development**

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Lint code
```

### **Database**

```bash
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio
pnpm db:reset         # Reset database
```

### **Package Management**

```bash
pnpm add <package>    # Add dependency
pnpm add -D <package> # Add dev dependency
pnpm remove <package> # Remove package
pnpm update           # Update all packages
```

### **Cleanup**

```bash
pnpm clean            # Clean build artifacts
pnpm clean:all        # Clean everything + lockfile
```

---

## 🔄 For New Team Members

**First Time Setup:**

```bash
# 1. Clone repo
git clone <repo-url>
cd hotel-booking

# 2. Install pnpm (if needed)
npm install -g pnpm

# 3. Install dependencies
pnpm install

# 4. Copy .env.example to .env
cp .env.example .env
# Windows: copy .env.example .env

# 5. Update .env with your credentials

# 6. Run migrations
pnpm db:migrate

# 7. Seed database
pnpm db:seed

# 8. Start dev server
pnpm dev
```

---

## 🆚 npm vs pnpm Commands

| npm | pnpm | Description |
|-----|------|-------------|
| `npm install` | `pnpm install` | Install dependencies |
| `npm install <pkg>` | `pnpm add <pkg>` | Add package |
| `npm uninstall <pkg>` | `pnpm remove <pkg>` | Remove package |
| `npm run <script>` | `pnpm <script>` | Run script |
| `npm update` | `pnpm update` | Update packages |
| `npm list` | `pnpm list` | List packages |
| `npm audit` | `pnpm audit` | Security audit |

---

## ⚠️ Important Notes

1. **Always use `pnpm`** instead of `npm` in this project
2. **Commit `pnpm-lock.yaml`** (do NOT commit `package-lock.json`)
3. **Node version**: Requires Node.js >=20.0.0
4. **Windows users**: Enable Developer Mode for symlinks

---

## 🐛 Troubleshooting

**"pnpm: command not found"**
```bash
npm install -g pnpm
```

**"Cannot find module"**
```bash
pnpm clean:all
pnpm install
```

**Prisma client not found**
```bash
pnpm db:generate
```

---

## 📚 Full Documentation

For complete migration guide, see: `docs/PNPM_MIGRATION.md`

---

**Happy coding!** 🎉
