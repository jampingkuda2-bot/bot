-- ============================================================
-- FISH IT - ELEMENTAL WEATHER DETECTOR v9 (UI SIMPLE)
-- ============================================================

local player = game.Players.LocalPlayer
local UserInputService = game:GetService("UserInputService")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local Workspace = game:GetService("Workspace")

print("🚀 Weather Detector v9 Loading...")

-- ============================================================
-- KONFIGURASI WEBHOOK
-- ============================================================
local WEBHOOK_URL = ""  -- Isi di sini atau lewat UI

-- ============================================================
-- DATA CUACA
-- ============================================================
local weatherData = {
    Fire = { Name = "Fire", Emoji = "🔥", Color = Color3.fromRGB(255, 68, 0), Keywords = {"fire", "api", "flame", "lava"} },
    Ice = { Name = "Ice", Emoji = "🧊", Color = Color3.fromRGB(100, 200, 255), Keywords = {"ice", "frost", "snow", "freeze"} },
    Storm = { Name = "Storm", Emoji = "⛈️", Color = Color3.fromRGB(255, 170, 0), Keywords = {"storm", "thunder", "lightning"} },
    Aurora = { Name = "Aurora", Emoji = "🌌", Color = Color3.fromRGB(0, 255, 200), Keywords = {"aurora"} },
    MeteorShower = { Name = "Meteor Shower", Emoji = "☄️", Color = Color3.fromRGB(255, 100, 50), Keywords = {"meteor", "shower"} },
    Fog = { Name = "Fog", Emoji = "🌫️", Color = Color3.fromRGB(180, 180, 200), Keywords = {"fog", "kabut"} }
}

-- ============================================================
-- VARIABEL
-- ============================================================
local currentWeather = nil
local isDetecting = true
local webhookEnabled = true
local webhookURL = WEBHOOK_URL

-- ============================================================
-- DETEKSI CUACA
-- ============================================================
local function detectWeather()
    local found = nil
    
    -- Cek di Workspace (Billboard, Text, Particle)
    pcall(function()
        for _, obj in pairs(Workspace:GetDescendants()) do
            if obj:IsA("BillboardGui") or obj:IsA("TextLabel") or obj:IsA("TextButton") then
                local text = obj.Text or ""
                local lower = text:lower()
                for weatherName, data in pairs(weatherData) do
                    for _, kw in ipairs(data.Keywords) do
                        if lower:find(kw) then
                            found = weatherName
                            return found
                        end
                    end
                end
            end
            if obj:IsA("ParticleEmitter") or obj:IsA("Fire") or obj:IsA("Smoke") then
                local name = obj.Name:lower()
                for weatherName, data in pairs(weatherData) do
                    for _, kw in ipairs(data.Keywords) do
                        if name:find(kw) then
                            found = weatherName
                            return found
                        end
                    end
                end
            end
        end
    end)
    if found then return found end
    
    -- Cek di Lighting
    pcall(function()
        for _, child in pairs(Lighting:GetChildren()) do
            local name = child.Name:lower()
            for weatherName, data in pairs(weatherData) do
                for _, kw in ipairs(data.Keywords) do
                    if name:find(kw) then
                        found = weatherName
                        return found
                    end
                end
            end
        end
    end)
    if found then return found end
    
    -- Cek di ReplicatedStorage
    pcall(function()
        for _, obj in pairs(ReplicatedStorage:GetDescendants()) do
            if obj:IsA("StringValue") or obj:IsA("ObjectValue") then
                local val = tostring(obj.Value):lower()
                for weatherName, data in pairs(weatherData) do
                    for _, kw in ipairs(data.Keywords) do
                        if val:find(kw) then
                            found = weatherName
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
            print("⚡ WEATHER: " .. detected)
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
-- UI SEDERHANA (PASTI MUNCUL)
-- ============================================================
local screenGui, mainFrame, weatherLabel, statusLabel, toggleBtn, webhookToggleBtn, inputBox, setBtn, testBtn

local function createUI()
    print("🖥️ Creating simple UI...")
    
    -- ScreenGui dengan background solid
    screenGui = Instance.new("ScreenGui")
    screenGui.Name = "WeatherUI"
    screenGui.Parent = player:FindFirstChild("PlayerGui") or player
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    
    -- Main Frame (warna solid)
    mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0, 280, 0, 280)
    mainFrame.Position = UDim2.new(0.5, -140, 0.5, -140)
    mainFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 40)
    mainFrame.BackgroundTransparency = 0  -- SOLID
    mainFrame.BorderSizePixel = 1
    mainFrame.BorderColor3 = Color3.fromRGB(100, 100, 200)
    mainFrame.Parent = screenGui
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 30)
    title.BackgroundTransparency = 1
    title.Text = "🌤️ Weather Detector"
    title.TextColor3 = Color3.fromRGB(255, 200, 50)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = mainFrame
    
    -- Weather display
    weatherLabel = Instance.new("TextLabel")
    weatherLabel.Size = UDim2.new(1, -20, 0, 40)
    weatherLabel.Position = UDim2.new(0, 10, 0, 35)
    weatherLabel.BackgroundColor3 = Color3.fromRGB(40, 40, 70)
    weatherLabel.BackgroundTransparency = 0
    weatherLabel.Text = "⏳ Detecting..."
    weatherLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    weatherLabel.TextScaled = true
    weatherLabel.Font = Enum.Font.GothamBold
    weatherLabel.Parent = mainFrame
    
    -- Status
    statusLabel = Instance.new("TextLabel")
    statusLabel.Size = UDim2.new(1, 0, 0, 20)
    statusLabel.Position = UDim2.new(0, 0, 0, 80)
    statusLabel.BackgroundTransparency = 1
    statusLabel.Text = "🟢 Detecting"
    statusLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    statusLabel.TextScaled = true
    statusLabel.Font = Enum.Font.Gotham
    statusLabel.Parent = mainFrame
    
    -- Toggle
    toggleBtn = Instance.new("TextButton")
    toggleBtn.Size = UDim2.new(0.8, 0, 0, 30)
    toggleBtn.Position = UDim2.new(0.1, 0, 0, 105)
    toggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
    toggleBtn.Text = "⏹ Stop"
    toggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    toggleBtn.TextScaled = true
    toggleBtn.Font = Enum.Font.Gotham
    toggleBtn.Parent = mainFrame
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
    webhookToggleBtn.Position = UDim2.new(0.1, 0, 0, 140)
    webhookToggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
    webhookToggleBtn.Text = "🔔 Webhook ON"
    webhookToggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    webhookToggleBtn.TextScaled = true
    webhookToggleBtn.Font = Enum.Font.Gotham
    webhookToggleBtn.Parent = mainFrame
    webhookToggleBtn.MouseButton1Click:Connect(function()
        webhookEnabled = not webhookEnabled
        webhookToggleBtn.Text = webhookEnabled and "🔔 Webhook ON" or "🔕 Webhook OFF"
        webhookToggleBtn.BackgroundColor3 = webhookEnabled and Color3.fromRGB(30, 80, 30) or Color3.fromRGB(80, 30, 30)
    end)
    
    -- Input webhook
    inputBox = Instance.new("TextBox")
    inputBox.Size = UDim2.new(0.8, 0, 0, 25)
    inputBox.Position = UDim2.new(0.1, 0, 0, 175)
    inputBox.BackgroundColor3 = Color3.fromRGB(50, 50, 70)
    inputBox.Text = ""
    inputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
    inputBox.TextScaled = true
    inputBox.Font = Enum.Font.Gotham
    inputBox.PlaceholderText = "URL webhook"
    inputBox.Parent = mainFrame
    
    -- Set & Test buttons
    setBtn = Instance.new("TextButton")
    setBtn.Size = UDim2.new(0.35, 0, 0, 25)
    setBtn.Position = UDim2.new(0.1, 0, 0, 205)
    setBtn.BackgroundColor3 = Color3.fromRGB(30, 60, 90)
    setBtn.Text = "Set"
    setBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    setBtn.TextScaled = true
    setBtn.Font = Enum.Font.Gotham
    setBtn.Parent = mainFrame
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
    testBtn.Position = UDim2.new(0.55, 0, 0, 205)
    testBtn.BackgroundColor3 = Color3.fromRGB(60, 80, 30)
    testBtn.Text = "🧪 Test"
    testBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    testBtn.TextScaled = true
    testBtn.Font = Enum.Font.Gotham
    testBtn.Parent = mainFrame
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
    
    -- Draggable
    local drag = false
    local dragStart, startPos
    mainFrame.InputBegan:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1 then
            drag = true
            dragStart = i.Position
            startPos = mainFrame.Position
        end
    end)
    mainFrame.InputEnded:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1 then drag = false end
    end)
    UserInputService.InputChanged:Connect(function(i)
        if drag and i.UserInputType == Enum.UserInputType.MouseMovement then
            local delta = i.Position - dragStart
            mainFrame.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X,
                                           startPos.Y.Scale, startPos.Y.Offset + delta.Y)
        end
    end)
    
    print("✅ UI created! Look for the window.")
end

-- ============================================================
-- JALANKAN
-- ============================================================
print("⚡ Fish It Elemental Weather Detector v9")
print("🔥 Fire | 🧊 Ice | ⛈️ Storm | 🌌 Aurora | ☄️ Meteor | 🌫️ Fog")

local success, err = pcall(createUI)
if not success then
    warn("❌ UI Error: " .. tostring(err))
    print("⚠️ Coba jalankan script test UI merah terlebih dahulu.")
end

isDetecting = true
task.spawn(detectionLoop)

UserInputService.InputBegan:Connect(function(input, gp)
    if gp then return end
    if input.KeyCode == Enum.KeyCode.W then
        isDetecting = not isDetecting
        if isDetecting then task.spawn(detectionLoop) end
        print("Detection:", isDetecting and "ON" or "OFF")
    end
end)

print("✅ Ready! Press W to toggle detection.")
