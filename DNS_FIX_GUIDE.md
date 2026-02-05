# DNS Fix for Neon Database Connection

## Problem
Your DNS server (192.168.33.243) is refusing queries for Neon's database hostname.
The database EXISTS (confirmed via Google DNS 8.8.8.8) but your network is blocking it.

## Solution: Change DNS to Google DNS

### Windows DNS Change Steps:

1. **Open Network Settings**:
   - Press `Win + R`
   - Type: `ncpa.cpl`
   - Press Enter

2. **Configure Network Adapter**:
   - Right-click your active network adapter (Wi-Fi or Ethernet)
   - Click "Properties"
   
3. **Change DNS**:
   - Select "Internet Protocol Version 4 (TCP/IPv4)"
   - Click "Properties"
   - Select "Use the following DNS server addresses"
   - Preferred DNS: `8.8.8.8`
   - Alternate DNS: `8.8.4.4`
   - Click "OK"

4. **Flush DNS Cache**:
   ```cmd
   ipconfig /flushdns
   ```

5. **Test Connection**:
   ```cmd
   nslookup ep-young-wave-adg10hd0-pooler.c-2.us-east-1.aws.neon.tech
   npx prisma db push
   ```

## Alternative: Quick PowerShell Fix

Run PowerShell as Administrator and execute:

```powershell
# Set DNS to Google DNS (8.8.8.8 and 8.8.4.4)
$adapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object -First 1
Set-DnsClientServerAddress -InterfaceAlias $adapter.Name -ServerAddresses ("8.8.8.8","8.8.4.4")

# Flush DNS cache
Clear-DnsClientCache

Write-Host "DNS changed to Google DNS (8.8.8.8)"
```

## Verify It Works

After changing DNS, test:

```cmd
nslookup ep-young-wave-adg10hd0-pooler.c-2.us-east-1.aws.neon.tech
```

You should see IP addresses without "Query refused" error.

Then test Prisma:

```cmd
npx prisma db push
```

## If You Can't Change DNS (Corporate Network)

Option 1: Use VPN
Option 2: Contact your network administrator
Option 3: Use mobile hotspot temporarily to test
Option 4: Add to Windows hosts file (temporary workaround)

### Hosts File Workaround:

Edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator):

```
44.198.216.75 ep-young-wave-adg10hd0-pooler.c-2.us-east-1.aws.neon.tech
```

Save and test connection.
