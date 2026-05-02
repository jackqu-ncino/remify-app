# Adds all environment variables to the Vercel project (persistent across deployments)
# Run from PowerShell:
#   cd "C:\Jack\Projects\Important Date Reminder"
#   .\set-env.ps1

$scope = "jackqu-ncinos-projects"

Write-Host ""
Write-Host "Setting Vercel environment variables..." -ForegroundColor Cyan
Write-Host ""

# Known values - set automatically
"https://antzgzrqatitezgpftva.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --scope $scope --force
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudHpnenJxYXRpdGV6Z3BmdHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM5MjQsImV4cCI6MjA5MzIyOTkyNH0.iF36v-FJiIK93EheUwOlmc8lpO1rvKeV1dj4sKEx4Ws" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --scope $scope --force
"https://important-date-reminder.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production --scope $scope --force

Write-Host "[OK] Supabase URL, anon key, and app URL set." -ForegroundColor Green
Write-Host ""

# Values the user must provide
Write-Host "Now enter the sensitive values:" -ForegroundColor Yellow
Write-Host ""

Write-Host "--> Supabase SERVICE ROLE key" -ForegroundColor Yellow
Write-Host "    https://supabase.com/dashboard/project/antzgzrqatitezgpftva/settings/api-keys" -ForegroundColor DarkGray
$serviceKey = Read-Host "Paste value"
$serviceKey | vercel env add SUPABASE_SERVICE_ROLE_KEY production --scope $scope --force

Write-Host ""
Write-Host "--> Resend API key (https://resend.com/api-keys)" -ForegroundColor Yellow
$resendKey = Read-Host "Paste value"
$resendKey | vercel env add RESEND_API_KEY production --scope $scope --force

Write-Host ""
Write-Host "--> From email address (e.g. reminders@send.yourdomain.com)" -ForegroundColor Yellow
$fromEmail = Read-Host "Paste value"
$fromEmail | vercel env add RESEND_FROM_EMAIL production --scope $scope --force

Write-Host ""
Write-Host "--> Cron secret (copy from your .env.local file)" -ForegroundColor Yellow
$cronSecret = Read-Host "Paste value"
$cronSecret | vercel env add CRON_SECRET production --scope $scope --force

Write-Host ""
Write-Host "All env vars set! Redeploying to production..." -ForegroundColor Cyan
vercel --prod --scope $scope

Write-Host ""
Write-Host "Done! Visit https://important-date-reminder.vercel.app" -ForegroundColor Green
