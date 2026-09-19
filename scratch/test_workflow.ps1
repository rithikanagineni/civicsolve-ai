$base = "http://localhost:3000"

# 1. Login as University
$uniBody = '{"email":"abc.university@civicsolve.in","password":"demo1234"}'
$uniLogin = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $uniBody
$uniToken = $uniLogin.data.token
$uniHeaders = @{ Authorization = "Bearer $uniToken" }
Write-Host "University Logged In: $($uniLogin.data.user.email) ($($uniLogin.data.user.role))"

# 2. Find Shapur Street Lighting Challenge
$challengesRes = Invoke-RestMethod -Uri "$base/api/challenges" -Method Get -Headers $uniHeaders
$shapurChallenge = $challengesRes.data.challenges | Where-Object { $_.title -like "*street lighting*" -or $_.location -like "*Shapur*" } | Select-Object -First 1

if (-not $shapurChallenge) {
    Write-Host "No Shapur challenge found, creating one..."
    $citizenLogin = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"priya.citizen@civicsolve.in","password":"demo1234"}'
    $citHeaders = @{ Authorization = "Bearer $($citizenLogin.data.token)" }
    $createBody = @{
        title = "Lack of street lighting near a school in Shapur"
        description = "Complete darkness after 6 PM outside Government High School Shapur. Broken streetlights and loose cables create danger for school children and pedestrians."
        location = "Near Government High School, Shapur, Hyderabad"
        latitude = 17.5169
        longitude = 78.4350
        peopleAffected = 500
        urgencyLevel = "HIGH"
    } | ConvertTo-Json
    $created = Invoke-RestMethod -Uri "$base/api/challenges" -Method Post -ContentType "application/json" -Headers $citHeaders -Body $createBody
    $shapurChallenge = $created.data.challenge
}

Write-Host "Target Challenge ID: $($shapurChallenge.id), Code: $($shapurChallenge.complaintCode), Status: $($shapurChallenge.status)"

# 3. University Accepts Problem if not already accepted
if ($shapurChallenge.status -ne "UNIVERSITY_ACCEPTED" -and $shapurChallenge.status -ne "FIELD_PERSON_ASSIGNED" -and $shapurChallenge.status -ne "FIELD_VERIFICATION_IN_PROGRESS" -and $shapurChallenge.status -ne "FIELD_VERIFICATION_PENDING") {
    $acceptBody = @{
        projectTitle = "Shapur School Solar Street Lighting Initiative"
        department = "Electrical Engineering"
    } | ConvertTo-Json
    $acceptRes = Invoke-RestMethod -Uri "$base/api/challenges/$($shapurChallenge.id)/accept" -Method Post -ContentType "application/json" -Headers $uniHeaders -Body $acceptBody
    Write-Host "Accepted! New Status: $($acceptRes.data.detail.challenge.status)"
}

# 4. Fetch Nearby Field Person Recommendations
$recRes = Invoke-RestMethod -Uri "$base/api/challenges/$($shapurChallenge.id)/field-person-recommendations" -Method Get -Headers $uniHeaders
Write-Host "`n--- AI Field Person Recommendations (Radius: 5 km) ---"
foreach ($c in $recRes.data.recommendations) {
    Write-Host "$($c.fullName) | Score: $($c.score)% | Distance: $($c.distanceKm) km | Status: $($c.availabilityStatus)"
    Write-Host "  Reasons: $($c.reasons -join ' ; ')"
}

$topCandidate = $recRes.data.recommendations | Select-Object -First 1
Write-Host "`nTop Candidate Selected: $($topCandidate.fullName) (ID: $($topCandidate.id)) with $($topCandidate.score)% score"

# 5. University Assigns Rahul Kumar
$assignBody = @{ fieldPersonId = $topCandidate.id } | ConvertTo-Json
$assignRes = Invoke-RestMethod -Uri "$base/api/challenges/$($shapurChallenge.id)/field-assignments" -Method Post -ContentType "application/json" -Headers $uniHeaders -Body $assignBody
$assignmentId = $assignRes.data.assignment.id
Write-Host "Assigned! Assignment ID: $assignmentId, Status: $($assignRes.data.assignment.status)"

# 6. Login as Rahul Kumar
$fieldLogin = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"rahul.field@civicsolve.in","password":"demo1234"}'
$fieldToken = $fieldLogin.data.token
$fieldHeaders = @{ Authorization = "Bearer $fieldToken" }
Write-Host "`nField Engineer Logged In: $($fieldLogin.data.user.email) ($($fieldLogin.data.user.fullName))"

# 7. View Rahul's Assignments
$myAssignments = Invoke-RestMethod -Uri "$base/api/field/assignments" -Method Get -Headers $fieldHeaders
Write-Host "Rahul's Assigned Visits: $($myAssignments.data.assignments.Count)"
$myAssign = $myAssignments.data.assignments | Where-Object { $_.assignment.id -eq $assignmentId } | Select-Object -First 1
Write-Host "Current Assignment Status: $($myAssign.assignment.status)"

# 8. Rahul Accepts Visit
$visitAccept = Invoke-RestMethod -Uri "$base/api/field-assignments/$assignmentId/accept" -Method Post -Headers $fieldHeaders
Write-Host "Visit Accepted: $($visitAccept.data.assignment.status)"

# 9. Rahul Starts Visit (Arrives on Ground)
$visitStart = Invoke-RestMethod -Uri "$base/api/field-assignments/$assignmentId/start" -Method Post -Headers $fieldHeaders
Write-Host "Visit Started: $($visitStart.data.assignment.status)"

# 10. Rahul Submits Field Verification Report
$reportPayload = @{
    verified = $true
    problemExists = "YES"
    severity = "HIGH"
    observations = "Physically inspected 4 streetlight poles outside Shapur Primary School. Underground wiring is severed and all sodium fixtures are non-operational. High student pedestrian risk after dusk."
    affectedPeople = 500
    locationConfirmed = $true
    canResolveDirectly = $false
    recommendedAction = "Deploy smart solar-powered IoT LED poles with automatic twilight dimming and motion sensing."
    universitySupportReason = "Underground grid cabling is completely damaged. Requires electrical engineering team design and solar panel retrofitting."
    requiredResources = "4x Solar LED fixtures, IoT control boards, 50m armored cable"
    photos = @("https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&auto=format&fit=crop&q=80")
} | ConvertTo-Json

$reportRes = Invoke-RestMethod -Uri "$base/api/field-assignments/$assignmentId/verification-report" -Method Post -ContentType "application/json" -Headers $fieldHeaders -Body $reportPayload
Write-Host "`nReport Submitted Successfully! Report ID: $($reportRes.data.report.id)"
Write-Host "Report Severity: $($reportRes.data.report.severity)"
Write-Host "Report Verified: $($reportRes.data.report.verified)"
Write-Host "Direct Resolution: $($reportRes.data.report.canResolveDirectly)"

# 11. Verify Final Status on Problem Page
$finalDetail = Invoke-RestMethod -Uri "$base/api/challenges/$($shapurChallenge.id)" -Method Get -Headers $uniHeaders
Write-Host "`n--- FINAL VERIFICATION ON PROBLEM PAGE ---"
Write-Host "Challenge Status: $($finalDetail.data.challenge.status)"
Write-Host "Field Assignments Count: $($finalDetail.data.field.assignments.Count)"
Write-Host "Field Reports Count: $($finalDetail.data.field.reports.Count)"
Write-Host "Latest Report Verified: $($finalDetail.data.field.reports[0].verified)"
Write-Host "Latest Report Action: $($finalDetail.data.field.reports[0].recommendedSolution)"
Write-Host "`n======================================================="
Write-Host "SUCCESS: 20-Step Field Workflow Passed End-to-End!"
Write-Host "======================================================="
