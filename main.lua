-- ============================================================
-- FISH IT - ELEMENTAL WEATHER DETECTOR v10 (FIX DETECTION)
-- ============================================================

local player = game.Players.LocalPlayer
local UserInputService = game:GetService("UserInputService")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local Workspace = game:GetService("Workspace")

print("🚀 Weather Detector v10 Loading...")

-- ============================================================
-- KONFIGURASI WEBHOOK
-- ============================================================
local WEBHOOK_URL = ""  -- Isi di sini atau lewat UI

-- ============================================================
-- DATA CUACA (DENGAN KEYWORD LENGKAP)
-- ============================================================
local weatherData = {
    Fire = { Name = "Fire", Emoji = "🔥", Color = Color3.fromRGB(255, 68, 0), 
             Keywords = {"fire", "api", "flame", "lava", "volcano", "retro volcano"} },
    Ice = { Name = "Ice", Emoji = "🧊", Color = Color3.fromRGB(100, 200, 255), 
             Keywords = {"ice", "frost", "snow", "freeze", "glacier", "retro ice"} },
    Storm = { Name = "Storm", Emoji = "⛈️", Color = Color3.fromRGB(255, 170, 0), 
             Keywords = {"storm", "thunder", "lightning", "petir", "badai", "retro lightning"} },
    Aurora = { Name = "Aurora", Emoji = "🌌", Color = Color3.fromRGB(0, 255, 200), 
             Keywords = {"aurora"} },
    MeteorShower = { Name = "Meteor Shower", Emoji = "☄️", Color = Color3.fromRGB(255, 100, 50), 
             Keywords = {"meteor", "shower", "hujan meteor"} },
    Fog = { Name = "Fog", Emoji = "🌫️", Color = Color3.fromRGB(180, 180, 200), 
             Keywords = {"fog", "kabut"} },
    -- Tambahkan generic "elemental" untuk jaga-jaga
    Elemental = { Name = "Elemental", Emoji = "⚡", Color = Color3.fromRGB(255, 255, 0), 
             Keywords = {"elemental"} }
}

-- ============================================================
-- VARIABEL
-- ============================================================
local currentWeather = nil
local isDetecting = true
local webhookEnabled = true
local webhookURL = WEBHOOK_URL
local isMinimized = false
local debugMode = false  -- Set ke true untuk log detail

-- ============================================================
-- DETEKSI CUACA (SCAN SEMUA)
-- ============================================================
local function detectWeather()
    local found = nil
    local matches = {}  -- Untuk debug
    
    -- Fungsi untuk memeriksa sebuah instance
    local function checkInstance(obj, source)
        if not obj then return end
        local name = obj.Name or ""
        local lowerName = name:lower()
        
        -- Cek properti yang mungkin berisi teks
        local props = {}
        if obj:IsA("StringValue") or obj:IsA("ObjectValue") then
            local val = tostring(obj.Value) or ""
            table.insert(props, val)
        end
        if obj:IsA("TextLabel") or obj:IsA("TextButton") or obj:IsA("TextBox") then
            local txt = obj.Text or ""
            table.insert(props, txt)
        end
        if obj:IsA("BillboardGui") then
            local txt = obj.Name or ""
            table.insert(props, txt)
        end
        -- Cek juga attribute (jika ada)
        local attrs = obj:GetAttributes()
        for _, v in pairs(attrs) do
            if type(v) == "string" then
                table.insert(props, v)
            end
        end
        
        -- Gabungkan semua teks
        local allText = lowerName .. " " .. table.concat(props, " "):lower()
        
        -- Periksa setiap keyword
        for weatherName, data in pairs(weatherData) do
            for _, kw in ipairs(data.Keywords) do
                if allText:find(kw) then
                    if not found then
                        found = weatherName
                    end
                    -- Catat untuk debug
                    table.insert(matches, string.format("%s -> %s (from %s)", weatherName, kw, source))
                    return weatherName  -- langsung return jika ditemukan
                end
            end
        end
        return nil
    end
    
    -- Scan di Workspace
    pcall(function()
        for _, obj in pairs(Workspace:GetDescendants()) do
            local result = checkInstance(obj, "Workspace")
            if result then found = result; break end
        end
    end)
    if found then 
        if debugMode then printMatches(matches) end
        return found 
    end
    
    -- Scan di Lighting
    pcall(function()
        for _, obj in pairs(Lighting:GetDescendants()) do
            local result = checkInstance(obj, "Lighting")
            if result then found = result; break end
        end
    end)
    if found then 
        if debugMode then printMatches(matches) end
        return found 
    end
    
    -- Scan di ReplicatedStorage
    pcall(function()
        for _, obj in pairs(ReplicatedStorage:GetDescendants()) do
            local result = checkInstance(obj, "ReplicatedStorage")
            if result then found = result; break end
        end
    end)
    if found then 
        if debugMode then printMatches(matches) end
        return found 
    end
    
    -- Scan di PlayerGui (untuk teks cuaca di layar)
    pcall(function()
        local playerGui = player:FindFirstChild("PlayerGui")
        if playerGui then
            for _, obj in pairs(playerGui:GetDescendants()) do
                local result = checkInstance(obj, "PlayerGui")
                if result then found = result; break end
            end
        end
    end)
    if found then 
        if debugMode then printMatches(matches) end
        return found 
    end
    
    -- Jika debugMode, cetak matches yang ditemukan (walau tidak ada yang cocok)
    if debugMode and #matches > 0 then
        print("🔍 Debug matches (tidak cukup untuk trigger):")
        for _, m in ipairs(matches) do
            print("  " .. m)
        end
    end
    
    return nil
end

-- Fungsi bantu untuk cetak matches
function printMatches(matches)
    print("🔍 Detected matches:")
    for _, m in ipairs(matches) do
        print("  " .. m)
    end
end

-- ============================================================
-- WEBHOOK
-- ============================================================
local function sendWebhook(weatherName, isTest)
    if not webhookEnabled or webhookURL == "" then return false end
    local weather = weatherData[weatherName]
    if not weather and not isTest then return false end
    
    local payload = {
        embeds = {{
            title = isTest and "🧪 Test" or "⚡ Weather Change!",
            description = isTest and "Webhook OK" or string.format("%s **%s** active", weather.Emoji, weather.Name),
            color = isTest and 0x00FF00 or 0xFFAA00,
            footer = { text = os.date("%H:%M:%S") }
        }}
    }
    
    local success = pcall(function()
        local requestFunc = syn and syn.request or http_request or request
        if requestFunc then
            return requestFunc({
                Url = webhookURL,
                Method = "POST",
                Headers = {["Content-Type"] = "application/json"},
                Body = HttpService:JSONEncode(payload)
            })
        end
    end)
    return success
end

-- ============================================================
-- LOOP DETEKSI
-- ============================================================
local function detectionLoop()
    while isDetecting do
        local detected = detectWeather()
        if detected and detected ~= currentWeather then
            currentWeather = detected
            print("⚡ WEATHER DETECTED: " .. detected)
            sendWebhook(detected)
            if weatherLabel then
                local w = weatherData[detected]
                weatherLabel.Text = w.Emoji .. " " .. w.Name
                weatherLabel.TextColor3 = w.Color
            end
        end
        task.wait(1)
    end
end

-- ============================================================
-- UI SEDERHANA + DRAG + MINIMIZE
-- ============================================================
local screenGui, mainFrame, weatherLabel, statusLabel, toggleBtn, webhookToggleBtn, inputBox, setBtn, testBtn, forceDetectBtn, minimizeBtn

local function createUI()
    print("🖥️ Creating UI with drag & minimize...")
    
    -- ScreenGui
    screenGui = Instance.new("ScreenGui")
    screenGui.Name = "WeatherUI"
    screenGui.Parent = player:FindFirstChild("PlayerGui") or player
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    
    -- Main Frame
    mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0, 280, 0, 320)
    mainFrame.Position = UDim2.new(0.5, -140, 0.5, -160)
    mainFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 40)
    mainFrame.BackgroundTransparency = 0
    mainFrame.BorderSizePixel = 1
    mainFrame.BorderColor3 = Color3.fromRGB(100, 100, 200)
    mainFrame.Parent = screenGui
    
    -- Title Bar (untuk drag)
    local titleBar = Instance.new("Frame")
    titleBar.Size = UDim2.new(1, 0, 0, 30)
    titleBar.BackgroundColor3 = Color3.fromRGB(30, 30, 60)
    titleBar.BackgroundTransparency = 0
    titleBar.BorderSizePixel = 0
    titleBar.Parent = mainFrame
    
    -- Title text
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(0.7, 0, 1, 0)
    title.BackgroundTransparency = 1
    title.Text = "🌤️ Weather Detector"
    title.TextColor3 = Color3.fromRGB(255, 200, 50)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = titleBar
    
    -- Minimize button
    minimizeBtn = Instance.new("TextButton")
    minimizeBtn.Size = UDim2.new(0, 30, 1, 0)
    minimizeBtn.Position = UDim2.new(0.85, 0, 0, 0)
    minimizeBtn.BackgroundColor3 = Color3.fromRGB(40, 40, 70)
    minimizeBtn.Text = "−"
    minimizeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    minimizeBtn.TextScaled = true
    minimizeBtn.Font = Enum.Font.GothamBold
    minimizeBtn.Parent = titleBar
    
    -- Close button
    local closeBtn = Instance.new("TextButton")
    closeBtn.Size = UDim2.new(0, 30, 1, 0)
    closeBtn.Position = UDim2.new(0.92, 0, 0, 0)
    closeBtn.BackgroundColor3 = Color3.fromRGB(60, 30, 30)
    closeBtn.Text = "✕"
    closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    closeBtn.TextScaled = true
    closeBtn.Font = Enum.Font.GothamBold
    closeBtn.Parent = titleBar
    closeBtn.MouseButton1Click:Connect(function()
        screenGui:Destroy()
        print("UI Closed")
    end)
    
    -- Content Frame (bisa di-hide saat minimize)
    local contentFrame = Instance.new("Frame")
    contentFrame.Size = UDim2.new(1, 0, 1, -30)
    contentFrame.Position = UDim2.new(0, 0, 0, 30)
    contentFrame.BackgroundTransparency = 1
    contentFrame.Parent = mainFrame
    
    -- Weather display
    weatherLabel = Instance.new("TextLabel")
    weatherLabel.Size = UDim2.new(1, -20, 0, 40)
    weatherLabel.Position = UDim2.new(0, 10, 0, 10)
    weatherLabel.BackgroundColor3 = Color3.fromRGB(40, 40, 70)
    weatherLabel.BackgroundTransparency = 0
    weatherLabel.Text = "⏳ Detecting..."
    weatherLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    weatherLabel.TextScaled = true
    weatherLabel.Font = Enum.Font.GothamBold
    weatherLabel.Parent = contentFrame
    
    -- Status
    statusLabel = Instance.new("TextLabel")
    statusLabel.Size = UDim2.new(1, 0, 0, 20)
    statusLabel.Position = UDim2.new(0, 0, 0, 55)
    statusLabel.BackgroundTransparency = 1
    statusLabel.Text = "🟢 Detecting"
    statusLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    statusLabel.TextScaled = true
    statusLabel.Font = Enum.Font.Gotham
    statusLabel.Parent = contentFrame
    
    -- Toggle detection
    toggleBtn = Instance.new("TextButton")
    toggleBtn.Size = UDim2.new(0.8, 0, 0, 30)
    toggleBtn.Position = UDim2.new(0.1, 0, 0, 80)
    toggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
    toggleBtn.Text = "⏹ Stop"
    toggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    toggleBtn.TextScaled = true
    toggleBtn.Font = Enum.Font.Gotham
    toggleBtn.Parent = contentFrame
    toggleBtn.MouseButton1Click:Connect(function()
        isDetecting = not isDetecting
        toggleBtn.Text = isDetecting and "⏹ Stop" or "▶ Start"
        toggleBtn.BackgroundColor3 = isDetecting and Color3.fromRGB(30, 80, 30) or Color3.fromRGB(80, 30, 30)
        statusLabel.Text = isDetecting and "🟢 Detecting" or "🔴 Paused"
        statusLabel.TextColor3 = isDetecting and Color3.fromRGB(100, 255, 100) or Color3.fromRGB(255, 100, 100)
        if isDetecting then task.spawn(detectionLoop) end
    end)
    
    -- Webhook toggle
    webhookToggleBtn = Instance.new("TextButton")
    webhookToggleBtn.Size = UDim2.new(0.8, 0, 0, 25)
    webhookToggleBtn.Position = UDim2.new(0.1, 0, 0, 115)
    webhookToggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
    webhookToggleBtn.Text = "🔔 Webhook ON"
    webhookToggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    webhookToggleBtn.TextScaled = true
    webhookToggleBtn.Font = Enum.Font.Gotham
    webhookToggleBtn.Parent = contentFrame
    webhookToggleBtn.MouseButton1Click:Connect(function()
        webhookEnabled = not webhookEnabled
        webhookToggleBtn.Text = webhookEnabled and "🔔 Webhook ON" or "🔕 Webhook OFF"
        webhookToggleBtn.BackgroundColor3 = webhookEnabled and Color3.fromRGB(30, 80, 30) or Color3.fromRGB(80, 30, 30)
    end)
    
    -- Input webhook
    inputBox = Instance.new("TextBox")
    inputBox.Size = UDim2.new(0.8, 0, 0, 25)
    inputBox.Position = UDim2.new(0.1, 0, 0, 150)
    inputBox.BackgroundColor3 = Color3.fromRGB(50, 50, 70)
    inputBox.Text = ""
    inputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
    inputBox.TextScaled = true
    inputBox.Font = Enum.Font.Gotham
    inputBox.PlaceholderText = "URL webhook"
    inputBox.Parent = contentFrame
    
    -- Set & Test buttons
    setBtn = Instance.new("TextButton")
    setBtn.Size = UDim2.new(0.35, 0, 0, 25)
    setBtn.Position = UDim2.new(0.1, 0, 0, 180)
    setBtn.BackgroundColor3 = Color3.fromRGB(30, 60, 90)
    setBtn.Text = "Set"
    setBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    setBtn.TextScaled = true
    setBtn.Font = Enum.Font.Gotham
    setBtn.Parent = contentFrame
    setBtn.MouseButton1Click:Connect(function()
        if inputBox.Text ~= "" then
            webhookURL = inputBox.Text
            statusLabel.Text = "✅ URL saved"
            statusLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
            task.wait(1.5)
            statusLabel.Text = isDetecting and "🟢 Detecting" or "🔴 Paused"
            statusLabel.TextColor3 = isDetecting and Color3.fromRGB(100, 255, 100) or Color3.fromRGB(255, 100, 100)
        end
    end)
    
    testBtn = Instance.new("TextButton")
    testBtn.Size = UDim2.new(0.35, 0, 0, 25)
    testBtn.Position = UDim2.new(0.55, 0, 0, 180)
    testBtn.BackgroundColor3 = Color3.fromRGB(60, 80, 30)
    testBtn.Text = "🧪 Test"
    testBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    testBtn.TextScaled = true
    testBtn.Font = Enum.Font.Gotham
    testBtn.Parent = contentFrame
    testBtn.MouseButton1Click:Connect(function()
        if webhookURL == "" then
            statusLabel.Text = "⚠️ Set URL first"
            statusLabel.TextColor3 = Color3.fromRGB(255, 255, 0)
            task.wait(1.5)
            statusLabel.Text = isDetecting and "🟢 Detecting" or "🔴 Paused"
            return
        end
        statusLabel.Text = "📤 Sending..."
        statusLabel.TextColor3 = Color3.fromRGB(255, 255, 0)
        local ok = sendWebhook(nil, true)
        statusLabel.Text = ok and "✅ Test OK" or "❌ Test failed"
        statusLabel.TextColor3 = ok and Color3.fromRGB(0, 255, 0) or Color3.fromRGB(255, 0, 0)
        task.wait(2)
        statusLabel.Text = isDetecting and "🟢 Detecting" or "🔴 Paused"
        statusLabel.TextColor3 = isDetecting and Color3.fromRGB(100, 255, 100) or Color3.fromRGB(255, 100, 100)
    end)
    
    -- Force Detect button (baru)
    forceDetectBtn = Instance.new("TextButton")
    forceDetectBtn.Size = UDim2.new(0.8, 0, 0, 25)
    forceDetectBtn.Position = UDim2.new(0.1, 0, 0, 215)
    forceDetectBtn.BackgroundColor3 = Color3.fromRGB(80, 60, 30)
    forceDetectBtn.Text = "🔍 Force Detect"
    forceDetectBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    forceDetectBtn.TextScaled = true
    forceDetectBtn.Font = Enum.Font.Gotham
    forceDetectBtn.Parent = contentFrame
    forceDetectBtn.MouseButton1Click:Connect(function()
        statusLabel.Text = "🔍 Scanning..."
        statusLabel.TextColor3 = Color3.fromRGB(255, 255, 0)
        debugMode = true  -- Aktifkan debug sementara
        local result = detectWeather()
        debugMode = false
        if result then
            statusLabel.Text = "✅ Found: " .. result
            statusLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
            -- Kirim notifikasi jika ditemukan
            sendWebhook(result)
            if weatherLabel then
                local w = weatherData[result]
                weatherLabel.Text = w.Emoji .. " " .. w.Name
                weatherLabel.TextColor3 = w.Color
            end
            currentWeather = result
        else
            statusLabel.Text = "❌ No weather detected"
            statusLabel.TextColor3 = Color3.fromRGB(255, 0, 0)
        end
        task.wait(2)
        statusLabel.Text = isDetecting and "🟢 Detecting" or "🔴 Paused"
        statusLabel.TextColor3 = isDetecting and Color3.fromRGB(100, 255, 100) or Color3.fromRGB(255, 100, 100)
    end)
    
    -- Minimize function
    minimizeBtn.MouseButton1Click:Connect(function()
        isMinimized = not isMinimized
        contentFrame.Visible = not isMinimized
        mainFrame.Size = isMinimized and UDim2.new(0, 280, 0, 30) or UDim2.new(0, 280, 0, 320)
        minimizeBtn.Text = isMinimized and "+" or "−"
    end)
    
    -- Draggable (mouse + touch)
    local drag = false
    local dragStart, startPos
    
    local function startDrag(input)
        drag = true
        dragStart = input.Position
        startPos = mainFrame.Position
    end
    local function endDrag() drag = false end
    local function moveDrag(input)
        if drag then
            local delta = input.Position - dragStart
            mainFrame.Position = UDim2.new(
                startPos.X.Scale,
                startPos.X.Offset + delta.X,
                startPos.Y.Scale,
                startPos.Y.Offset + delta.Y
            )
        end
    end
    
    titleBar.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 then startDrag(input) end
    end)
    titleBar.InputEnded:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 then endDrag() end
    end)
    UserInputService.InputChanged:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseMovement then moveDrag(input) end
    end)
    titleBar.TouchBegan:Connect(function(input) startDrag(input) end)
    titleBar.TouchEnded:Connect(function() endDrag() end)
    UserInputService.TouchMoved:Connect(function(input) moveDrag(input) end)
    
    print("✅ UI with drag & minimize created.")
end

-- ============================================================
-- JALANKAN
-- ============================================================
print("⚡ Fish It Elemental Weather Detector v10")
print("🔥 Fire | 🧊 Ice | ⛈️ Storm | 🌌 Aurora | ☄️ Meteor | 🌫️ Fog")
print("🔍 Gunakan tombol 'Force Detect' untuk cek deteksi manual")

local success, err = pcall(createUI)
if not success then
    warn("❌ UI Error: " .. tostring(err))
end

isDetecting = true
task.spawn(detectionLoop)

-- Keybind W
UserInputService.InputBegan:Con
