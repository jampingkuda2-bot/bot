-- ============================================================
-- FISH IT - WEATHER DETECTOR v6 (Mobile Friendly + Drag & Minimize)
-- ============================================================

local player = game.Players.LocalPlayer
local UserInputService = game:GetService("UserInputService")
local HttpService = game:GetService("HttpService")

print("🚀 Weather Detector v6 (Mobile) Loading...")

-- ============================================================
-- KONFIGURASI
-- ============================================================
local WEBHOOK_URL = ""  -- Isi di sini atau lewat UI

-- ============================================================
-- DATA CUACA
-- ============================================================
local weatherData = {
    Fire  = { Name = "Fire",  Emoji = "🔥", Color = Color3.fromRGB(255, 68, 0) },
    Storm = { Name = "Storm", Emoji = "⛈️", Color = Color3.fromRGB(255, 170, 0) },
    Frost = { Name = "Frost", Emoji = "❄️", Color = Color3.fromRGB(136, 221, 255) }
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
-- DETEKSI WEATHER
-- ============================================================
local function detectWeather()
    local ReplicatedStorage = game:GetService("ReplicatedStorage")
    local Lighting = game:GetService("Lighting")
    
    for _, obj in pairs(ReplicatedStorage:GetDescendants()) do
        if obj:IsA("StringValue") or obj:IsA("ObjectValue") then
            local val = tostring(obj.Value):lower()
            if val:find("fire") then return "Fire"
            elseif val:find("storm") then return "Storm"
            elseif val:find("frost") then return "Frost" end
        end
    end
    
    for _, child in pairs(Lighting:GetChildren()) do
        local name = child.Name:lower()
        if name:find("fire") then return "Fire"
        elseif name:find("storm") then return "Storm"
        elseif name:find("frost") then return "Frost" end
    end
    
    return nil
end

-- ============================================================
-- FUNGSI REQUEST WEBHOOK (MULTI-METODE)
-- ============================================================
local function requestWebhook(url, data)
    if syn and syn.request then
        return syn.request({
            Url = url,
            Method = "POST",
            Headers = {["Content-Type"] = "application/json"},
            Body = HttpService:JSONEncode(data)
        })
    end
    if http_request then
        return http_request({
            Url = url,
            Method = "POST",
            Headers = {["Content-Type"] = "application/json"},
            Body = HttpService:JSONEncode(data)
        })
    end
    if request then
        return request({
            Url = url,
            Method = "POST",
            Headers = {["Content-Type"] = "application/json"},
            Body = HttpService:JSONEncode(data)
        })
    end
    error("Tidak ada metode request!")
end

local function sendWebhook(weatherName, isTest)
    if not webhookEnabled or webhookURL == "" then return false end
    if not webhookURL:find("discord.com/api/webhooks/") then
        print("⚠️ URL webhook tidak valid!")
        return false
    end
    
    local weather = weatherData[weatherName]
    if not weather and not isTest then return false end
    
    local payload = {
        embeds = {{
            title = isTest and "🧪 Test Webhook" or "🌤️ Weather Change!",
            description = isTest and "Webhook berhasil terhubung!" or 
                          string.format("%s **%s** terdeteksi!", weather.Emoji, weather.Name),
            color = isTest and 0x00FF00 or 0xFFAA00,
            footer = { text = os.date("%Y-%m-%d %H:%M:%S") }
        }}
    }
    
    local success, response = pcall(function()
        return requestWebhook(webhookURL, payload)
    end)
    
    if success and response then
        print("✅ Webhook terkirim!")
        return true
    else
        print("❌ Gagal kirim webhook: " .. tostring(response))
        return false
    end
end

-- ============================================================
-- LOOP DETEKSI
-- ============================================================
local function detectionLoop()
    while isDetecting do
        local detected = detectWeather()
        if detected and detected ~= currentWeather then
            currentWeather = detected
            print("🌤️ Weather: " .. detected)
            sendWebhook(detected)
            if weatherLabel then
                local w = weatherData[detected]
                weatherLabel.Text = w.Emoji .. " " .. w.Name
                weatherLabel.TextColor3 = w.Color
            end
        end
        task.wait(2)
    end
end

-- ============================================================
-- UI (Mobile Friendly: Drag & Minimize)
-- ============================================================
local screenGui, mainFrame, weatherLabel, statusLabel, toggleBtn, webhookToggleBtn, inputBox, setBtn, testBtn, minimizeBtn
local headerFrame, contentFrame

local function createUI()
    print("🖥️ Creating UI (Mobile)...")
    
    screenGui = Instance.new("ScreenGui")
    screenGui.Name = "WeatherUI"
    screenGui.Parent = player:WaitForChild("PlayerGui")
    screenGui.ResetOnSpawn = false
    
    -- Main Frame
    mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0, 320, 0, 320)
    mainFrame.Position = UDim2.new(0.5, -160, 0.5, -160)
    mainFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 30)
    mainFrame.BackgroundTransparency = 0
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    mainFrame.ClipsDescendants = true  -- Agar konten terpotong saat minimize
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = mainFrame
    
    local border = Instance.new("UIStroke")
    border.Color = Color3.fromRGB(80, 80, 150)
    border.Thickness = 2
    border.Parent = mainFrame
    
    -- Header (untuk drag dan tombol minimize)
    headerFrame = Instance.new("Frame")
    headerFrame.Size = UDim2.new(1, 0, 0, 35)
    headerFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 50)
    headerFrame.BackgroundTransparency = 0
    headerFrame.BorderSizePixel = 0
    headerFrame.Parent = mainFrame
    
    local headerCorner = Instance.new("UICorner")
    headerCorner.CornerRadius = UDim.new(0, 12)
    headerCorner.Parent = headerFrame
    
    -- Title di header
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(0.7, 0, 1, 0)
    title.BackgroundTransparency = 1
    title.Text = "🌤️ Weather"
    title.TextColor3 = Color3.fromRGB(255, 200, 50)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = headerFrame
    
    -- Tombol minimize
    minimizeBtn = Instance.new("TextButton")
    minimizeBtn.Size = UDim2.new(0, 30, 0, 30)
    minimizeBtn.Position = UDim2.new(1, -35, 0.5, -15)
    minimizeBtn.BackgroundColor3 = Color3.fromRGB(60, 60, 80)
    minimizeBtn.Text = "━"
    minimizeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    minimizeBtn.TextScaled = true
    minimizeBtn.Font = Enum.Font.Gotham
    minimizeBtn.Parent = headerFrame
    local minCorner = Instance.new("UICorner")
    minCorner.CornerRadius = UDim.new(0, 4)
    minCorner.Parent = minimizeBtn
    
    minimizeBtn.MouseButton1Click:Connect(function()
        isMinimized = not isMinimized
        if isMinimized then
            mainFrame.Size = UDim2.new(0, 160, 0, 35)  -- Hanya header
            minimizeBtn.Text = "□"  -- Maximize icon
        else
            mainFrame.Size = UDim2.new(0, 320, 0, 320)  -- Kembali normal
            minimizeBtn.Text = "━"
        end
    end)
    
    -- Konten (semua widget di dalam contentFrame)
    contentFrame = Instance.new("Frame")
    contentFrame.Size = UDim2.new(1, 0, 1, -35)
    contentFrame.Position = UDim2.new(0, 0, 0, 35)
    contentFrame.BackgroundTransparency = 1
    contentFrame.Parent = mainFrame
    
    -- Weather display
    weatherLabel = Instance.new("TextLabel")
    weatherLabel.Size = UDim2.new(1, 0, 0, 50)
    weatherLabel.Position = UDim2.new(0, 0, 0, 5)
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
    statusLabel.Position = UDim2.new(0, 0, 0, 60)
    statusLabel.BackgroundTransparency = 1
    statusLabel.Text = "🟢 Detecting"
    statusLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    statusLabel.TextScaled = true
    statusLabel.Font = Enum.Font.Gotham
    statusLabel.Parent = contentFrame
    
    -- Toggle detection
    toggleBtn = Instance.new("TextButton")
    toggleBtn.Size = UDim2.new(0.85, 0, 0, 30)
    toggleBtn.Position = UDim2.new(0.075, 0, 0, 85)
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
    
    -- Webhook toggle
    webhookToggleBtn = Instance.new("TextButton")
    webhookToggleBtn.Size = UDim2.new(0.85, 0, 0, 28)
    webhookToggleBtn.Position = UDim2.new(0.075, 0, 0, 120)
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
    
    -- Input webhook
    local inputLabel = Instance.new("TextLabel")
    inputLabel.Size = UDim2.new(0.35, 0, 0, 20)
    inputLabel.Position = UDim2.new(0.05, 0, 0, 155)
    inputLabel.BackgroundTransparency = 1
    inputLabel.Text = "Webhook:"
    inputLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    inputLabel.TextScaled = true
    inputLabel.Font = Enum.Font.Gotham
    inputLabel.Parent = contentFrame
    
    inputBox = Instance.new("TextBox")
    inputBox.Size = UDim2.new(0.6, 0, 0, 24)
    inputBox.Position = UDim2.new(0.35, 0, 0, 153)
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
    
    -- Set button
    setBtn = Instance.new("TextButton")
    setBtn.Size = UDim2.new(0.4, 0, 0, 24)
    setBtn.Position = UDim2.new(0.55, 0, 0, 183)
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
            print("🔗 Webhook URL set")
            task.wait(1.5)
            statusLabel.Text = isDetecting and "🟢 Detecting" or "🔴 Paused"
            statusLabel.TextColor3 = isDetecting and Color3.fromRGB(100, 255, 100) or Color3.fromRGB(255, 100, 100)
        end
    end)
    
    -- Test button
    testBtn = Instance.new("TextButton")
    testBtn.Size = UDim2.new(0.4, 0, 0, 24)
    testBtn.Position = UDim2.new(0.05, 0, 0, 183)
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
    
    -- ============================================================
    -- DRAG (Mobile & PC)
    -- ============================================================
    local dragging = false
    local dragStartPos, dragStartMouse
    local function onInputBegan(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or 
           input.UserInputType == Enum.UserInputType.Touch then
            -- Cek apakah input terjadi di header (bukan di tombol minimize)
            local pos = input.Position
            local absPos = mainFrame.AbsolutePosition
            local absSize = mainFrame.AbsoluteSize
            -- Header hanya bagian atas 35px
            if pos.Y >= absPos.Y and pos.Y <= absPos.Y + 35 and
               pos.X >= absPos.X and pos.X <= absPos.X + absSize.X then
                dragging = true
                dragStartPos = mainFrame.Position
                dragStartMouse = input.Position
            end
        end
    end
    
    local function onInputChanged(input)
        if dragging then
            if input.UserInputType == Enum.UserInputType.MouseMovement or
               input.UserInputType == Enum.UserInputType.Touch then
                local delta = input.Position - dragStartMouse
                mainFrame.Position = UDim2.new(
                    dragStartPos.X.Scale,
                    dragStartPos.X.Offset + delta.X,
                    dragStartPos.Y.Scale,
                    dragStartPos.Y.Offset + delta.Y
                )
            end
        end
    end
    
    local function onInputEnded(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or
           input.UserInputType == Enum.UserInputType.Touch then
            dragging = false
        end
    end
    
    -- Untuk PC
    UserInputService.InputBegan:Connect(onInputBegan)
    UserInputService.InputChanged:Connect(onInputChanged)
    UserInputService.InputEnded:Connect(onInputEnded)
    
    print("✅ UI Mobile created!")
end

-- ============================================================
-- MAIN
-- ============================================================
print("🎣 Fish It Weather Detector v6 (Mobile)")
print("🔥 Fire | ⛈️ Storm | ❄️ Frost")

pcall(createUI)

isDetecting = true
task.spawn(detectionLoop)

-- Keybind W
UserInputService.InputBegan:Connect(function(input, gp)
    if gp then return end
    if input.KeyCode == Enum.KeyCode.W then
        isDetecting = not isDetecting
        if isDetecting then task.spawn(detectionLoop) end
        print("Detection:", isDetecting and "ON" or "OFF")
    end
end)

print("✅ Script ready! Drag header untuk geser, tombol ━ untuk minimize.")
