$uni = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"abc.university@civicsolve.in","password":"demo1234"}'
$res = Invoke-RestMethod -Uri 'http://localhost:3000/api/challenges/28/field-person-recommendations' -Headers @{ Authorization = "Bearer $($uni.data.token)" }
$res | ConvertTo-Json -Depth 5
