-- ============================================================
-- FISH IT - ELEMENTAL WEATHER DETECTOR v3
-- 3 Cuaca: Fire, Storm, Frost
-- UI dengan input webhook + test webhook
-- ============================================================

local player = game.Players.LocalPlayer
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local HttpService = game:GetService("HttpService")
local UserInputService = game:GetService("UserInputService")

-- ============================================================
-- DEFAULT WEBHOOK (bisa kosong, diisi via UI)
-- ============================================================
local DEFAULT_WEBHOOK = ""  -- Biarkan kosong, user akan mengisi

-- ============================================================
-- DATA 3 CUACA
-- ============================================================
local weatherData = {
    Fire = {
        Name = "Fire",
        Emoji = "🔥",
        Description = "Meningkatkan damage dan kecepatan reel",
        Color = 0xFF4400
    },
    Storm = {
        Name = "Storm",
        Emoji = "⛈️",
        Description = "Meningkatkan luck dan reeling speed",
        Color = 0xFFAA00
    },
    Frost = {
        Name = "Frost",
        Emoji = "❄️",
        Description = "Menambahkan efek frozen, mengurangi kecepatan musuh",
        Color = 0x88DDFF
    }
}

-- ============================================================
-- VARIABEL
-- ============================================================
local currentWeather = nil
local isDetecting = false
local webhookEnabled = true
local webhookURL = DEFAULT_WEBHOOK

-- ============================================================
-- FUNGSI DETEKSI
-- ============================================================
local function detectFromReplicatedStorage()
    for _, child in pairs(ReplicatedStorage:GetDescendants()) do
        if child:IsA("StringValue") or child:IsA("ObjectValue") then
            local val = child.Value
            if type(val) == "string" then
                local lower = val:lower()
                for weatherName, _ in pairs(weatherData) do
                    if lower:find(weatherName:lower()) then
                        return weatherName
                    end
                end
            end
        end
    end
    return nil
end

local function detectFromLighting()
    local sky = Lighting:FindFirstChild("Sky")
    if sky then
        for weatherName, _ in pairs(weatherData) do
            if sky.Name and sky.Name:find(weatherName) then
                return weatherName
            end
        end
    end
    local atmosphere = Lighting:FindFirstChild("Atmosphere")
    if atmosphere then
        for weatherName, _ in pairs(weatherData) do
            if atmosphere.Name and atmosphere.Name:find(weatherName) then
                return weatherName
            end
        end
    end
    return nil
end

local function detectFromRemote()
    local net = ReplicatedStorage:FindFirstChild("Packages") and 
                ReplicatedStorage.Packages:FindFirstChild("_Index") and
                ReplicatedStorage.Packages._Index:FindFirstChild("sleitnick_net@0.2.0") and
                ReplicatedStorage.Packages._Index["sleitnick_net@0.2.0"]:FindFirstChild("net")
    if net then
        local getWeather = net:FindFirstChild("RF/GetCurrentWeather") or 
                           net:FindFirstChild("RF/GetWeather")
        if getWeather and getWeather:IsA("RemoteFunction") then
            local success, result = pcall(function()
                return getWeather:InvokeServer()
            end)
            if success and result then
                for weatherName, _ in pairs(weatherData) do
                    if tostring(result):lower():find(weatherName:lower()) then
                        return weatherName
                    end
                end
            end
        end
    end
    return nil
end

local function detectFromWorkspace()
    for _, child in pairs(workspace:GetDescendants()) do
        if child:IsA("ParticleEmitter") or child:IsA("Fire") or child:IsA("Smoke") then
            local parentName = child.Parent and child.Parent.Name or ""
            if parentName:lower():find("fire") then
                return "Fire"
            elseif parentName:lower():find("storm") or parentName:lower():find("lightning") then
                return "Storm"
            elseif parentName:lower():find("frost") or parentName:lower():find("ice") then
                return "Frost"
            end
        end
    end
    return nil
end

local function getCurrentWeather()
    local weather = detectFromRemote() or 
                    detectFromReplicatedStorage() or 
                    detectFromLighting() or
                    detectFromWorkspace()
    return weather
end

-- ============================================================
-- FUNGSI WEBHOOK (dengan test)
-- ============================================================
local function sendWebhook(weatherName, isTest)
    if not webhookEnabled then return end
    if webhookURL == "" then
        print("⚠️ Webhook URL belum diisi!")
        return
    end
    
    local weather = weatherData[weatherName]
    if not weather and not isTest then return end
    
    local title = isTest and "🧪 Test Webhook" or "🌤️ Elemental Weather Change!"
    local desc = isTest and "Webhook berhasil terhubung!" or 
                 string.format("**Weather:** %s %s\n**Effect:** %s\n**Time:** %s",
                 weather.Emoji, weather.Name, weather.Description, os.date("%Y-%m-%d %H:%M:%S"))
    local color = isTest and 0x00FF00 or (weather and weather.Color or 0xFFFFFF)
    
    local data = {
        ["content"] = "",
        ["embeds"] = {{
            ["title"] = title,
            ["description"] = desc,
            ["color"] = color,
            ["footer"] = {
                ["text"] = "Fish It Detector • " .. (isTest and "Test" or "Real-time")
            }
        }}
    }
    
    local success, response = pcall(function()
        return syn and syn.request({
            Url = webhookURL,
            Method = "POST",
            Headers = {["Content-Type"] = "application/json"},
            Body = HttpService:JSONEncode(data)
        })
    end)
    
    if success then
        print(isTest and "✅ Test webhook berhasil!" or "✅ Webhook terkirim: " .. weather.Name)
        return true
    else
        warn(isTest and "❌ Test webhook gagal!" or "❌ Gagal kirim webhook!")
        return false
    end
end

-- ============================================================
-- LOOP DETEKSI
-- ============================================================
local function detectionLoop()
    while isDetecting do
        local detected = getCurrentWeather()
        if detected and detected ~= currentWeather then
            currentWeather = detected
            print("🌤️ Weather changed to: " .. detected)
            sendWebhook(detected)
            updateWeatherDisplay(detected)
        end
        task.wait(2)
    end
end

-- ============================================================
-- UI LENGKAP
-- ============================================================
local screenGui
local mainFrame
local weatherLabel
local statusLabel
local toggleBtn
local webhookToggleBtn
local webhookInput
local setWebhookBtn
local testWebhookBtn

local function createUI()
    screenGui = Instance.new("ScreenGui")
    screenGui.Name = "WeatherDetector"
    screenGui.Parent = player.PlayerGui
    
    mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0, 320, 0, 340)
    mainFrame.Position = UDim2.new(0.5, -160, 0.5, -170)
    mainFrame.BackgroundColor3 = Color3.fromRGB(15, 15, 25)
    mainFrame.BackgroundTransparency = 0.15
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = mainFrame
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 35)
    title.BackgroundTransparency = 1
    title.Text = "🌤️ Weather Detector"
    title.TextColor3 = Color3.fromRGB(255, 200, 50)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = mainFrame
    
    -- Subtitle
    local sub = Instance.new("TextLabel")
    sub.Size = UDim2.new(1, 0, 0, 20)
    sub.Position = UDim2.new(0, 0, 0, 30)
    sub.BackgroundTransparency = 1
    sub.Text = "Fire • Storm • Frost"
    sub.TextColor3 = Color3.fromRGB(150, 200, 255)
    sub.TextScaled = true
    sub.Font = Enum.Font.Gotham
    sub.Parent = mainFrame
    
    -- Current Weather
    weatherLabel = Instance.new("TextLabel")
    weatherLabel.Size = UDim2.new(1, 0, 0, 45)
    weatherLabel.Position = UDim2.new(0, 0, 0, 55)
    weatherLabel.BackgroundColor3 = Color3.fromRGB(30, 30, 50)
    weatherLabel.BackgroundTransparency = 0.5
    weatherLabel.Text = "⏳ Detecting..."
    weatherLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    weatherLabel.TextScaled = true
    weatherLabel.Font = Enum.Font.Gotham
    weatherLabel.Parent = mainFrame
    
    local wCorner = Instance.new("UICorner")
    wCorner.CornerRadius = UDim.new(0, 6)
    wCorner.Parent = weatherLabel
    
    -- Status
    statusLabel = Instance.new("TextLabel")
    statusLabel.Size = UDim2.new(1, 0, 0, 20)
    statusLabel.Position = UDim2.new(0, 0, 0, 105)
    statusLabel.BackgroundTransparency = 1
    statusLabel.Text = "🟢 Detecting Active"
    statusLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    statusLabel.TextScaled = true
    statusLabel.Font = Enum.Font.Gotham
    statusLabel.Parent = mainFrame
    
    -- Tombol Toggle Detection
    toggleBtn = Instance.new("TextButton")
    toggleBtn.Size = UDim2.new(0.85, 0, 0, 30)
    toggleBtn.Position = UDim2.new(0.075, 0, 0, 130)
    toggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
    toggleBtn.Text = "⏹️ Stop Detection"
    toggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    toggleBtn.TextScaled = true
    toggleBtn.Font = Enum.Font.Gotham
    toggleBtn.Parent = mainFrame
    
    local tCorner = Instance.new("UICorner")
    tCorner.CornerRadius = UDim.new(0, 6)
    tCorner.Parent = toggleBtn
    
    toggleBtn.MouseButton1Click:Connect(function()
        isDetecting = not isDetecting
        if isDetecting then
            toggleBtn.Text = "⏹️ Stop Detection"
            toggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
            statusLabel.Text = "🟢 Detecting Active"
            statusLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
            task.spawn(detectionLoop)
        else
            toggleBtn.Text = "▶️ Start Detection"
            toggleBtn.BackgroundColor3 = Color3.fromRGB(80, 30, 30)
            statusLabel.Text = "🔴 Detection Paused"
            statusLabel.TextColor3 = Color3.fromRGB(255, 100, 100)
        end
    end)
    
    -- Webhook Toggle
    webhookToggleBtn = Instance.new("TextButton")
    webhookToggleBtn.Size = UDim2.new(0.85, 0, 0, 28)
    webhookToggleBtn.Position = UDim2.new(0.075, 0, 0, 165)
    webhookToggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
    webhookToggleBtn.Text = "🔔 Webhook: ON"
    webhookToggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    webhookToggleBtn.TextScaled = true
    webhookToggleBtn.Font = Enum.Font.Gotham
    webhookToggleBtn.Parent = mainFrame
    
    local wbCorner = Instance.new("UICorner")
    wbCorner.CornerRadius = UDim.new(0, 6)
    wbCorner.Parent = webhookToggleBtn
    
    webhookToggleBtn.MouseButton1Click:Connect(function()
        webhookEnabled = not webhookEnabled
        webhookToggleBtn.Text = webhookEnabled and "🔔 Webhook: ON" or "🔕 Webhook: OFF"
        webhookToggleBtn.BackgroundColor3 = webhookEnabled and 
            Color3.fromRGB(30, 80, 30) or Color3.fromRGB(80, 30, 30)
    end)
    
    -- Input Webhook
    local inputLabel = Instance.new("TextLabel")
    inputLabel.Size = UDim2.new(0.4, 0, 0, 20)
    inputLabel.Position = UDim2.new(0.05, 0, 0, 200)
    inputLabel.BackgroundTransparency = 1
    inputLabel.Text = "Webhook URL:"
    inputLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    inputLabel.TextScaled = true
    inputLabel.Font = Enum.Font.Gotham
    inputLabel.Parent = mainFrame
    
    webhookInput = Instance.new("TextBox")
    webhookInput.Size = UDim2.new(0.6, 0, 0, 25)
    webhookInput.Position = UDim2.new(0.35, 0, 0, 198)
    webhookInput.BackgroundColor3 = Color3.fromRGB(40, 40, 60)
    webhookInput.Text = webhookURL
    webhookInput.TextColor3 = Color3.fromRGB(255, 255, 255)
    webhookInput.TextScaled = true
    webhookInput.Font = Enum.Font.Gotham
    webhookInput.PlaceholderText = "https://discord.com/api/webhooks/..."
    webhookInput.Parent = mainFrame
    
    local inputCorner = Instance.new("UICorner")
    inputCorner.CornerRadius = UDim.new(0, 4)
    inputCorner.Parent = webhookInput
    
    -- Tombol Set Webhook
    setWebhookBtn = Instance.new("TextButton")
    setWebhookBtn.Size = UDim2.new(0.4, 0, 0, 25)
    setWebhookBtn.Position = UDim2.new(0.55, 0, 0, 230)
    setWebhookBtn.BackgroundColor3 = Color3.fromRGB(30, 60, 90)
    setWebhookBtn.Text = "Set Webhook"
    setWebhookBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    setWebhookBtn.TextScaled = true
    setWebhookBtn.Font = Enum.Font.Gotham
    setWebhookBtn.Parent = mainFrame
    
    local setCorner = Instance.new("UICorner")
    setCorner.CornerRadius = UDim.new(0, 4)
    setCorner.Parent = setWebhookBtn
    
    setWebhookBtn.MouseButton1Click:Connect(function()
        local url = webhookInput.Text
        if url ~= "" then
            webhookURL = url
            print("✅ Webhook URL disimpan!")
        else
            print("⚠️ URL tidak boleh kosong!")
        end
    end)
    
    -- Tombol Test Webhook
    testWebhookBtn = Instance.new("TextButton")
    testWebhookBtn.Size = UDim2.new(0.4, 0, 0, 25)
    testWebhookBtn.Position = UDim2.new(0.05, 0, 0, 230)
    testWebhookBtn.BackgroundColor3 = Color3.fromRGB(60, 80, 30)
    testWebhookBtn.Text = "🧪 Test"
    testWebhookBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    testWebhookBtn.TextScaled = true
    testWebhookBtn.Font = Enum.Font.Gotham
    testWebhookBtn.Parent = mainFrame
    
    local testCorner = Instance.new("UICorner")
    testCorner.CornerRadius = UDim.new(0, 4)
    testCorner.Parent = testWebhookBtn
    
    testWebhookBtn.MouseButton1Click:Connect(function()
        if webhookURL == "" then
            print("⚠️ Set webhook URL terlebih dahulu!")
            return
        end
        print("📤 Mengirim test webhook...")
        local success = sendWebhook(nil, true)
        if success then
            statusLabel.Text = "✅ Test berhasil!"
            statusLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
            task.wait(2)
            statusLabel.Text = isDetecting and "🟢 Detecting Active" or "🔴 Detection Paused"
            statusLabel.TextColor3 = isDetecting and Color3.fromRGB(100, 255, 100) or Color3.fromRGB(255, 100, 100)
        else
            statusLabel.Text = "❌ Test gagal!"
            statusLabel.TextColor3 = Color3.fromRGB(255, 0, 0)
            task.wait(2)
            statusLabel.Text = isDetecting and "🟢 Detecting Active" or "🔴 Detection Paused"
            statusLabel.TextColor3 = isDetecting and Color3.fromRGB(100, 255, 100) or Color3.fromRGB(255, 100, 100)
        end
    end)
    
    -- Draggable
    local dragging = false
    local dragStart, startPos
    
    mainFrame.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 then
            dragging = true
            dragStart = input.Position
            startPos = mainFrame.Position
        end
    end)
    
    mainFrame.InputEnded:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 then
            dragging = false
        end
    end)
    
    UserInputService.InputChanged:Connect(function(input)
        if dragging and input.UserInputType == Enum.UserInputType.MouseMovement then
            local delta = input.Position - dragStart
            mainFrame.Position = UDim2.new(
                startPos.X.Scale,
                startPos.X.Offset + delta.X,
                startPos.Y.Scale,
                startPos.Y.Offset + delta.Y
            )
        end
    end)
end

function updateWeatherDisplay(weatherName)
    local weather = weatherData[weatherName]
    if weather then
        weatherLabel.Text = string.format("%s %s", weather.Emoji, weather.Name)
        weatherLabel.TextColor3 = Color3.fromRGB(
            (weather.Color >> 16) & 0xFF,
            (weather.Color >> 8) & 0xFF,
            weather.Color & 0xFF
        )
    else
        weatherLabel.Text = "❓ Unknown: " .. tostring(weatherName)
    end
end

-- ============================================================
-- INIT
-- ============================================================
print("🌤️ Fish It Elemental Weather Detector v3 Loaded!")
print("🔥 Fire | ⛈️ Storm | ❄️ Frost")
print("📡 Mode: Detection Only | No Purchase")
print("🔗 Masukkan webhook URL di UI dan klik 'Set Webhook'")

isDetecting = true
task.spawn(detectionLoop)
task.spawn(createUI)

-- Keybind W
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.W then
        isDetecting = not isDetecting
        if isDetecting then
            task.spawn(detectionLoop)
        end
        print("Detection: " .. (isDetecting and "ON" or "OFF"))
    end
end)

print("✅ Script siap! Tekan 'W' untuk toggle deteksi")
