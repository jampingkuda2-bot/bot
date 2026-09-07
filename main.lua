-- ============================================================
-- FISH IT - ELEMENTAL WEATHER DETECTOR v8 (FIX UI)
-- ============================================================

local player = game.Players.LocalPlayer
local UserInputService = game:GetService("UserInputService")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local Workspace = game:GetService("Workspace")

print("🚀 Weather Detector v8 Loading...")

-- ============================================================
-- KONFIGURASI WEBHOOK
-- ============================================================
local WEBHOOK_URL = ""  -- Isi di sini atau lewat UI

-- ============================================================
-- DATA CUACA (TERBARU)
-- ============================================================
local weatherData = {
    Fire = { Name = "Fire", Emoji = "🔥", Color = Color3.fromRGB(255, 68, 0), Keywords = {"fire", "api", "flame", "lava", "volcano"} },
    Ice = { Name = "Ice", Emoji = "🧊", Color = Color3.fromRGB(100, 200, 255), Keywords = {"ice", "frost", "snow", "freeze", "glacier"} },
    Storm = { Name = "Storm", Emoji = "⛈️", Color = Color3.fromRGB(255, 170, 0), Keywords = {"storm", "badai", "thunder", "lightning", "petir"} },
    Aurora = { Name = "Aurora", Emoji = "🌌", Color = Color3.fromRGB(0, 255, 200), Keywords = {"aurora"} },
    MeteorShower = { Name = "Meteor Shower", Emoji = "☄️", Color = Color3.fromRGB(255, 100, 50), Keywords = {"meteor", "shower", "hujan meteor"} },
    Fog = { Name = "Fog", Emoji = "🌫️", Color = Color3.fromRGB(180, 180, 200), Keywords = {"fog", "kabut"} }
}

-- ============================================================
-- VARIABEL
-- ============================================================
local currentWeather = nil
local isDetecting = true
local webhookEnabled = true
local webhookURL = WEBHOOK_URL
local isMinimized = false

-- ============================================================
-- DETEKSI CUACA (IMPROVED)
-- ============================================================
local function detectWeather()
    local found = nil
    
    -- 1. CEK BILLBOARD / TEKS
    pcall(function()
        for _, obj in pairs(Workspace:GetDescendants()) do
            if obj:IsA("BillboardGui") or obj:IsA("TextLabel") or obj:IsA("TextButton") then
                local text = obj.Text or ""
                local lower = text:lower()
                for weatherName, data in pairs(weatherData) do
                    for _, kw in ipairs(data.Keywords) do
                        if lower:find(kw) then
                            found = weatherName
                            print("🔍 Detected via Billboard: " .. text)
                            return found
                        end
                    end
                end
            end
        end
    end)
    if found then return found end
    
    -- 2. CEK EFFECT / PARTIKEL
    pcall(function()
        for _, obj in pairs(Workspace:GetDescendants()) do
            if obj:IsA("ParticleEmitter") or obj:IsA("Fire") or obj:IsA("Smoke") or obj:IsA("Sparkles") or obj:IsA("Attachment") then
                local parentName = obj.Parent and obj.Parent.Name or ""
                local fullName = (parentName .. obj.Name):lower()
                for weatherName, data in pairs(weatherData) do
                    for _, kw in ipairs(data.Keywords) do
                        if fullName:find(kw) then
                            found = weatherName
                            print("🔍 Detected via Particle: " .. obj.Name)
                            return found
                        end
                    end
                end
            end
        end
    end)
    if found then return found end
    
    -- 3. CEK LIGHTING / SKY
    pcall(function()
        for _, child in pairs(Lighting:GetChildren()) do
            local name = child.Name:lower()
            for weatherName, data in pairs(weatherData) do
                for _, kw in ipairs(data.Keywords) do
                    if name:find(kw) then
                        found = weatherName
                        print("🔍 Detected via Lighting: " .. child.Name)
                        return found
                    end
                end
            end
        end
    end)
    if found then return found end
    
    -- 4. CEK REPLICATEDSTORAGE
    pcall(function()
        for _, obj in pairs(ReplicatedStorage:GetDescendants()) do
            if obj:IsA("StringValue") or obj:IsA("ObjectValue") then
                local val = tostring(obj.Value):lower()
                for weatherName, data in pairs(weatherData) do
                    for _, kw in ipairs(data.Keywords) do
                        if val:find(kw) then
                            found = weatherName
                            print("🔍 Detected via ReplicatedStorage: " .. obj.Name)
                            return found
                        end
                    end
                end
            end
        end
    end)
    
    return found
end

-- ============================================================
-- FUNGSI WEBHOOK (MULTI-METODE)
-- ============================================================
local function requestWebhook(url, data)
    if syn and syn.request then
        return syn.request({Url = url, Method = "POST", Headers = {["Content-Type"] = "application/json"}, Body = HttpService:JSONEncode(data)})
    end
    if http_request then
        return http_request({Url = url, Method = "POST", Headers = {["Content-Type"] = "application/json"}, Body = HttpService:JSONEncode(data)})
    end
    if request then
        return request({Url = url, Method = "POST", Headers = {["Content-Type"] = "application/json"}, Body = HttpService:JSONEncode(data)})
    end
    error("Tidak ada metode request yang tersedia!")
end

local function sendWebhook(weatherName, isTest)
    if not webhookEnabled or webhookURL == "" then return false end
    local weather = weatherData[weatherName]
    if not weather and not isTest then return false end
    
    local payload = {
        embeds = {{
            title = isTest and "🧪 Test Webhook" or "⚡ Elemental Weather Detected!",
            description = isTest and "Webhook connected!" or string.format("%s **%s** is now active!", weather.Emoji, weather.Name),
            color = isTest and 0x00FF00 or 0xFFAA00,
            footer = { text = os.date("%Y-%m-%d %H:%M:%S") }
        }}
    }
    
    local success = pcall(function()
        return requestWebhook(webhookURL, payload)
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
-- UI (SEDERHANA & ROBUST)
-- ============================================================
local screenGui, mainFrame, weatherLabel, statusLabel, toggleBtn, webhookToggleBtn, inputBox, setBtn, testBtn, minimizeBtn

local function createUI()
    print("🖥️ Creating UI...")
    
    -- Pastikan PlayerGui ada
    local playerGui = player:FindFirstChild("PlayerGui")
    if not playerGui then
        playerGui = Instance.new("PlayerGui")
        playerGui.Parent = player
        print("⚠️ PlayerGui dibuat baru.")
    end
    
    -- Buat ScreenGui
    screenGui = Instance.new("ScreenGui")
    screenGui.Name = "WeatherUI"
    screenGui.Parent = playerGui
    screenGui.ResetOnSpawn = false
    
    -- Main Frame (dengan warna solid)
    mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0, 320, 0, 320)
    mainFrame.Position = UDim2.new(0.5, -160, 0.5, -160)
    mainFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 30)
    mainFrame.BackgroundTransparency = 0  -- SOLID
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    
    -- Corner
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = mainFrame
    
    -- Border
    local border = Instance.new("UIStroke")
    border.Color = Color3.fromRGB(80, 80, 150)
    border.Thickness = 2
    border.Parent = mainFrame
    
    -- Title Bar (drag area)
    local titleBar = Instance.new("Frame")
    titleBar.Size = UDim2.new(1, 0, 0, 35)
    titleBar.BackgroundColor3 = Color3.fromRGB(20, 20, 50)
    titleBar.BackgroundTransparency = 0
    titleBar.BorderSizePixel = 0
    titleBar.Parent = mainFrame
    local titleCorner = Instance.new("UICorner")
    titleCorner.CornerRadius = UDim.new(0, 12)
    titleCorner.Parent = titleBar
    
    -- Title Text
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(0.7, 0, 1, 0)
    title.BackgroundTransparency = 1
    title.Text = "🌤️ Weather Detector"
    title.TextColor3 = Color3.fromRGB(255, 200, 50)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = titleBar
    
    -- Minimize
    minimizeBtn = Instance.new("TextButton")
    minimizeBtn.Size = UDim2.new(0, 30, 1, 0)
    minimizeBtn.Position = UDim2.new(0.85, 0, 0, 0)
    minimizeBtn.BackgroundColor3 = Color3.fromRGB(40, 40, 70)
    minimizeBtn.Text = "−"
    minimizeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    minimizeBtn.TextScaled = true
    minimizeBtn.Font = Enum.Font.GothamBold
    minimizeBtn.Parent = titleBar
    local minCorner = Instance.new("UICorner")
    minCorner.CornerRadius = UDim.new(0, 6)
    minCorner.Parent = minimizeBtn
    
    -- Close
    local closeBtn = Instance.new("TextButton")
    closeBtn.Size = UDim2.new(0, 30, 1, 0)
    closeBtn.Position = UDim2.new(0.92, 0, 0, 0)
    closeBtn.BackgroundColor3 = Color3.fromRGB(60, 30, 30)
    closeBtn.Text = "✕"
    closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    closeBtn.TextScaled = true
    closeBtn.Font = Enum.Font.GothamBold
    closeBtn.Parent = titleBar
    local closeCorner = Instance.new("UICorner")
    closeCorner.CornerRadius = UDim.new(0, 6)
    closeCorner.Parent = closeBtn
    closeBtn.MouseButton1Click:Connect(function()
        screenGui:Destroy()
        print("UI Closed")
    end)
    
    -- Content Frame
    local contentFrame = Instance.new("Frame")
    contentFrame.Size = UDim2.new(1, 0, 1, -35)
    contentFrame.Position = UDim2.new(0, 0, 0, 35)
    contentFrame.BackgroundTransparency = 1
    contentFrame.Parent = mainFrame
    
    -- Subtitle
    local sub = Instance.new("TextLabel")
    sub.Size = UDim2.new(1, 0, 0, 20)
    sub.Position = UDim2.new(0, 0, 0, 5)
    sub.BackgroundTransparency = 1
    sub.Text = "🔥 Fire  🧊 Ice  ⛈️ Storm  🌌 Aurora  ☄️ Meteor  🌫️ Fog"
    sub.TextColor3 = Color3.fromRGB(180, 180, 220)
    sub.TextScaled = true
    sub.Font = Enum.Font.Gotham
    sub.Parent = contentFrame
    
    -- Weather Display
    weatherLabel = Instance.new("TextLabel")
    weatherLabel.Size = UDim2.new(1, 0, 0, 50)
    weatherLabel.Position = UDim2.new(0, 0, 0, 30)
    weatherLabel.BackgroundColor3 = Color3.fromRGB(30, 30, 60)
    weatherLabel.BackgroundTransparency = 0
    weatherLabel.Text = "⏳ Detecting..."
    weatherLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    weatherLabel.TextScaled = true
    weatherLabel.Font = Enum.Font.GothamBold
    weatherLabel.Parent = contentFrame
    local wCorner = Instance.new("UICorner")
    wCorner.CornerRadius = UDim.new(0, 6)
    wCorner.Parent = weatherLabel
    
    -- Status
    statusLabel = Instance.new("TextLabel")
    statusLabel.Size = UDim2.new(1, 0, 0, 20)
    statusLabel.Position = UDim2.new(0, 0, 0, 85)
    statusLabel.BackgroundTransparency = 1
    statusLabel.Text = "🟢 Detecting"
    statusLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    statusLabel.TextScaled = true
    statusLabel.Font = Enum.Font.Gotham
    statusLabel.Parent = contentFrame
    
    -- Toggle Detection
    toggleBtn = Instance.new("TextButton")
    toggleBtn.Size = UDim2.new(0.85, 0, 0, 30)
    toggleBtn.Position = UDim2.new(0.075, 0, 0, 110)
    toggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
    toggleBtn.Text = "⏹ Stop"
    toggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    toggleBtn.TextScaled = true
    toggleBtn.Font = Enum.Font.Gotham
    toggleBtn.Parent = contentFrame
    local tCorner = Instance.new("UICorner")
    tCorner.CornerRadius = UDim.new(0, 6)
    tCorner.Parent = toggleBtn
    toggleBtn.MouseButton1Click:Connect(function()
        isDetecting = not isDetecting
        toggleBtn.Text = isDetecting and "⏹ Stop" or "▶ Start"
        toggleBtn.BackgroundColor3 = isDetecting and Color3.fromRGB(30, 80, 30) or Color3.fromRGB(80, 30, 30)
        statusLabel.Text = isDetecting and "🟢 Detecting" or "🔴 Paused"
        statusLabel.TextColor3 = isDetecting and Color3.fromRGB(100, 255, 100) or Color3.fromRGB(255, 100, 100)
        if isDetecting then task.spawn(detectionLoop) end
    end)
    
    -- Webhook Toggle
    webhookToggleBtn = Instance.new("TextButton")
    webhookToggleBtn.Size = UDim2.new(0.85, 0, 0, 28)
    webhookToggleBtn.Position = UDim2.new(0.075, 0, 0, 145)
    webhookToggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
    webhookToggleBtn.Text = "🔔 Webhook ON"
    webhookToggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    webhookToggleBtn.TextScaled = true
    webhookToggleBtn.Font = Enum.Font.Gotham
    webhookToggleBtn.Parent = contentFrame
    local wbCorner = Instance.new("UICorner")
    wbCorner.CornerRadius = UDim.new(0, 6)
    wbCorner.Parent = webhookToggleBtn
    webhookToggleBtn.MouseButton1Click:Connect(function()
        webhookEnabled = not webhookEnabled
        webhookToggleBtn.Text = webhookEnabled and "🔔 Webhook ON" or "🔕 Webhook OFF"
        webhookToggleBtn.BackgroundColor3 = webhookEnabled and Color3.fromRGB(30, 80, 30) or Color3.fromRGB(80, 30, 30)
    end)
    
    -- Input Webhook
    local inputLabel = Instance.new("TextLabel")
    inputLabel.Size = UDim2.new(0.35, 0, 0, 20)
    inputLabel.Position = UDim2.new(0.05, 0, 0, 180)
    inputLabel.BackgroundTransparency = 1
    inputLabel.Text = "Webhook:"
    inputLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    inputLabel.TextScaled = true
    inputLabel.Font = Enum.Font.Gotham
    inputLabel.Parent = contentFrame
    
    inputBox = Instance.new("TextBox")
    inputBox.Size = UDim2.new(0.6, 0, 0, 24)
    inputBox.Position = UDim2.new(0.35, 0, 0, 178)
    inputBox.BackgroundColor3 = Color3.fromRGB(50, 50, 70)
    inputBox.Text = ""
    inputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
    inputBox.TextScaled = true
    inputBox.Font = Enum.Font.Gotham
    inputBox.PlaceholderText = "URL webhook"
    inputBox.Parent = contentFrame
    local inCorner = Instance.new("UICorner")
    inCorner.CornerRadius = UDim.new(0, 4)
    inCorner.Parent = inputBox
    
    -- Set Button
    setBtn = Instance.new("TextButton")
    setBtn.Size = UDim2.new(0.4, 0, 0, 24)
    setBtn.Position = UDim2.new(0.55, 0, 0, 208)
    setBtn.BackgroundColor3 = Color3.fromRGB(30, 60, 90)
    setBtn.Text = "Set"
    setBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    setBtn.TextScaled = true
    setBtn.Font = Enum.Font.Gotham
    setBtn.Parent = contentFrame
    local setCorner = Instance.new("UICorner")
    setCorner.CornerRadius = UDim.new(0, 4)
    setCorner.Parent = setBtn
    setBtn.MouseButton1Click:Connect(function()
        local url = inputBox.Text
        if url ~= "" then
            webhookURL = url
            statusLabel.Text = "✅ URL saved"
            statusLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
            print("🔗 Webhook URL diupdate: " .. webhookURL)
            task.wait(1.5)
            statusLabel.Text = isDetecting and "🟢 Detecting" or "🔴 Paused"
            statusLabel.TextColor3 = isDetecting and Color3.fromRGB(100, 255, 100) or Color3.fromRGB(255, 100, 100)
        end
    end)
    
    -- Test Button
    testBtn = Instance.new("TextButton")
    testBtn.Size = UDim2.new(0.4, 0, 0, 24)
    testBtn.Position = UDim2.new(0.05, 0, 0, 208)
    testBtn.BackgroundColor3 = Color3.fromRGB(60, 80, 30)
    testBtn.Text = "🧪 Test"
    testBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    testBtn.TextScaled = true
    testBtn.Font = Enum.Font.Gotham
    testBtn.Parent = contentFrame
    local testCorner = Instance.new("UICorner")
    testCorner.CornerRadius = UDim.new(0, 4)
    testCorner.Parent = testBtn
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
    
    -- Minimize function
    minimizeBtn.MouseButton1Click:Connect(function()
        isMinimized = not isMinimized
        contentFrame.Visible = not isMinimized
        mainFrame.Size = isMinimized and UDim2.new(0, 320, 0, 35) or UDim2.new(0, 320, 0, 320)
        minimizeBtn.Text = isMinimized and "+" or "−"
    end)
    
    -- Draggable (Mouse + Touch)
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
    
    print("✅ UI created successfully!")
end

-- ============================================================
-- MAIN
-- ============================================================
print("⚡ Fish It Elemental Weather Detector v8")
print("🔥 Fire | 🧊 Ice | ⛈️ Storm | 🌌 Aurora | ☄️ Meteor | 🌫️ Fog")

-- Coba buat UI dengan error handling
local success, err = pcall(createUI)
if not success then
    warn("❌ Gagal membuat UI: " .. tostring(err))
    print("⚠️ Coba jalankan ulang atau gunakan executor lain.")
else
    print("✅ UI muncul! Cari jendela di layar.")
end

-- Mulai deteksi
isDetecting = true
task.spawn
