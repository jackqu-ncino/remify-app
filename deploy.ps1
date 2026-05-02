# Important Date Reminder - One-time Vercel Deploy Script
# Run from PowerShell:
#   cd "C:\Jack\Projects\Important Date Reminder"
#   .\deploy.ps1

Write-Host ""
Write-Host "=============================="
Write-Host "  Important Date Reminder"
Write-Host "  Vercel Deployment Setup"
Write-Host "=============================="
Write-Host ""

# Step 1: Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed." -ForegroundColor Red
    Write-Host "Download it from https://nodejs.org and re-run this script." -ForegroundColor Yellow
    exit 1
}
Write-Host "[1/5] Node.js found: $(node --version)" -ForegroundColor Green

# Step 2: Install Vercel CLI
Write-Host "[2/5] Installing Vercel CLI..." -ForegroundColor Cyan
npm install -g vercel 2>&1 | Out-Null
Write-Host "[2/5] Vercel CLI ready." -ForegroundColor Green

# Step 3: Install dependencies
Write-Host "[3/5] Installing project dependencies..." -ForegroundColor Cyan
npm install
Write-Host "[3/5] Dependencies installed." -ForegroundColor Green

# Step 4: Collect env vars
Write-Host ""
Write-Host "[4/5] Setting up environment variables." -ForegroundColor Cyan
Write-Host ""

$SUPABASE_URL      = "https://antzgzrqatitezgpftva.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudHpnenJxYXRpdGV6Z3BmdHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM5MjQsImV4cCI6MjA5MzIyOTkyNH0.iF36v-FJiIK93EheUwOlmc8lpO1rvKeV1dj4sKEx4Ws"

Write-Host "  Supabase URL and anon key are pre-filled." -ForegroundColor DarkGray
Write-Host ""
Write-Host "  --> Get your SERVICE ROLE key from:" -ForegroundColor Yellow
Write-Host "      https://supabase.com/dashboard/project/antzgzrqatitezgpftva/settings/api" -ForegroundColor Yellow
$SUPABASE_SERVICE_KEY = Read-Host "  Paste Supabase SERVICE ROLE key"

Write-Host ""
Write-Host "  --> Get your Resend API key from: https://resend.com/api-keys" -ForegroundColor Yellow
$RESEND_API_KEY = Read-Host "  Paste Resend API key"

Write-Host ""
Write-Host "  --> From email address (e.g. reminders@send.yourdomain.com)" -ForegroundColor Yellow
$RESEND_FROM = Read-Host "  From email"

Write-Host ""
Write-Host "  --> App URL (press Enter to fill in after deploy)" -ForegroundColor Yellow
$APP_URL = Read-Host "  App URL"
if (-not $APP_URL) { $APP_URL = "https://placeholder.vercel.app" }

$chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
$CRON_SECRET = -join (1..32 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
Write-Host ""
Write-Host "  Cron secret auto-generated." -ForegroundColor DarkGray

$envContent = "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL`nNEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY`nSUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY`nRESEND_API_KEY=$RESEND_API_KEY`nRESEND_FROM_EMAIL=$RESEND_FROM`nCRON_SECRET=$CRON_SECRET`nNEXT_PUBLIC_APP_URL=$APP_URL"
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "[4/5] .env.local written." -ForegroundColor Green

# Step 5: Deploy to Vercel
Write-Host ""
Write-Host "[5/5] Deploying to Vercel..." -ForegroundColor Cyan
Write-Host "      A browser window will open to log in - use your existing Vercel account."
Write-Host ""

$vercelArgs = @(
    "deploy", "--yes",
    "--env", "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL",
    "--env", "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY",
    "--env", "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY",
    "--env", "RESEND_API_KEY=$RESEND_API_KEY",
    "--env", "RESEND_FROM_EMAIL=$RESEND_FROM",
    "--env", "CRON_SECRET=$CRON_SECRET",
    "--env", "NEXT_PUBLIC_APP_URL=$APP_URL",
    "--scope", "jackqu-ncinos-projects"
)

& vercel @vercelArgs

Write-Host ""
Write-Host "=============================="
Write-Host "  Done!" -ForegroundColor Green
Write-Host "=============================="
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Copy the deployment URL shown above"
Write-Host "  2. Run: vercel --prod --scope jackqu-ncinos-projects"
Write-Host "     to promote it to your production URL"
Write-Host ""
