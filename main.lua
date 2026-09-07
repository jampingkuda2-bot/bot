-- ============================================================
-- FISH IT - WEATHER DETECTOR v5 (FIX WEBHOOK)
-- ============================================================

local player = game.Players.LocalPlayer
local UserInputService = game:GetService("UserInputService")
local HttpService = game:GetService("HttpService")

print("🚀 Weather Detector v5 Loading...")

-- ============================================================
-- KONFIGURASI (GANTI DENGAN WEBHOOK KAMU)
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
    -- Metode 1: syn.request (Synapse X, Krnl, dll)
    if syn and syn.request then
        print("📤 Menggunakan syn.request...")
        local response = syn.request({
            Url = url,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json"
            },
            Body = HttpService:JSONEncode(data)
        })
        return response
    end
    
    -- Metode 2: http_request (beberapa executor)
    if http_request then
        print("📤 Menggunakan http_request...")
        local response = http_request({
            Url = url,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json"
            },
            Body = HttpService:JSONEncode(data)
        })
        return response
    end
    
    -- Metode 3: request (beberapa executor)
    if request then
        print("📤 Menggunakan request...")
        local response = request({
            Url = url,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json"
            },
            Body = HttpService:JSONEncode(data)
        })
        return response
    end
    
    -- Metode 4: HttpService (Roblox native, butuh proxy)
    if HttpService and HttpService.PostAsync then
        print("📤 Menggunakan HttpService.PostAsync...")
        local response = HttpService:PostAsync(url, HttpService:JSONEncode(data), Enum.HttpContentType.ApplicationJson)
        return { StatusCode = 200, Body = response }
    end
    
    error("Tidak ada metode request yang tersedia!")
end

-- ============================================================
-- FUNGSI KIRIM WEBHOOK
-- ============================================================
local function sendWebhook(weatherName, isTest)
    if not webhookEnabled then
        print("⛔ Webhook disabled")
        return false
    end
    
    if webhookURL == "" then
        print("⚠️ Webhook URL kosong! Set URL di UI.")
        return false
    end
    
    -- Validasi URL
    if not webhookURL:find("discord.com/api/webhooks/") then
        print("⚠️ URL webhook tidak valid! Pastikan URL Discord.")
        return false
    end
    
    local weather = weatherData[weatherName]
    if not weather and not isTest then
        print("⚠️ Cuaca tidak dikenal: " .. tostring(weatherName))
        return false
    end
    
    -- Buat payload
    local payload = {
        embeds = {{
            title = isTest and "🧪 Test Webhook" or "🌤️ Weather Change!",
            description = isTest and "Webhook berhasil terhubung!" or 
                          string.format("%s **%s** terdeteksi!", weather.Emoji, weather.Name),
            color = isTest and 0x00FF00 or 0xFFAA00,
            footer = { text = os.date("%Y-%m-%d %H:%M:%S") }
        }}
    }
    
    print("📤 Mengirim webhook ke Discord...")
    print("📝 Payload: " .. HttpService:JSONEncode(payload))
    
    local success, response = pcall(function()
        return requestWebhook(webhookURL, payload)
    end)
    
    if success and response then
        print("✅ Webhook berhasil dikirim!")
        print("📊 Response status: " .. (response.StatusCode or "unknown"))
        if response.Body then
            print("📄 Response body: " .. tostring(response.Body))
        end
        return true
    else
        print("❌ Gagal mengirim webhook!")
        print("⚠️ Error: " .. tostring(response))
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
            print("🌤️ Weather berubah: " .. detected)
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
-- UI
-- ============================================================
local screenGui, mainFrame, weatherLabel, statusLabel, toggleBtn, webhookToggleBtn, inputBox, setBtn, testBtn

local function createUI()
    print("🖥️ Creating UI...")
    
    screenGui = Instance.new("ScreenGui")
    screenGui.Name = "WeatherUI"
    screenGui.Parent = player:WaitForChild("PlayerGui")
    screenGui.ResetOnSpawn = false
    
    mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0, 320, 0, 300)
    mainFrame.Position = UDim2.new(0.5, -160, 0.5, -150)
    mainFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 30)
    mainFrame.BackgroundTransparency = 0
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = mainFrame
    
    local border = Instance.new("UIStroke")
    border.Color = Color3.fromRGB(80, 80, 150)
    border.Thickness = 2
    border.Parent = mainFrame
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 35)
    title.BackgroundTransparency = 1
    title.Text = "🌤️ Weather Detector"
    title.TextColor3 = Color3.fromRGB(255, 200, 50)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = mainFrame
    
    -- Sub
    local sub = Instance.new("TextLabel")
    sub.Size = UDim2.new(1, 0, 0, 20)
    sub.Position = UDim2.new(0, 0, 0, 30)
    sub.BackgroundTransparency = 1
    sub.Text = "🔥 Fire  ⛈️ Storm  ❄️ Frost"
    sub.TextColor3 = Color3.fromRGB(180, 180, 220)
    sub.TextScaled = true
    sub.Font = Enum.Font.Gotham
    sub.Parent = mainFrame
    
    -- Weather display
    weatherLabel = Instance.new("TextLabel")
    weatherLabel.Size = UDim2.new(1, 0, 0, 50)
    weatherLabel.Position = UDim2.new(0, 0, 0, 55)
    weatherLabel.BackgroundColor3 = Color3.fromRGB(30, 30, 60)
    weatherLabel.BackgroundTransparency = 0
    weatherLabel.Text = "⏳ Detecting..."
    weatherLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    weatherLabel.TextScaled = true
    weatherLabel.Font = Enum.Font.GothamBold
    weatherLabel.Parent = mainFrame
    
    local wCorner = Instance.new("UICorner")
    wCorner.CornerRadius = UDim.new(0, 6)
    wCorner.Parent = weatherLabel
    
    -- Status
    statusLabel = Instance.new("TextLabel")
    statusLabel.Size = UDim2.new(1, 0, 0, 20)
    statusLabel.Position = UDim2.new(0, 0, 0, 110)
    statusLabel.BackgroundTransparency = 1
    statusLabel.Text = "🟢 Detecting"
    statusLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    statusLabel.TextScaled = true
    statusLabel.Font = Enum.Font.Gotham
    statusLabel.Parent = mainFrame
    
    -- Toggle detection
    toggleBtn = Instance.new("TextButton")
    toggleBtn.Size = UDim2.new(0.85, 0, 0, 30)
    toggleBtn.Position = UDim2.new(0.075, 0, 0, 135)
    toggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
    toggleBtn.Text = "⏹ Stop"
    toggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    toggleBtn.TextScaled = true
    toggleBtn.Font = Enum.Font.Gotham
    toggleBtn.Parent = mainFrame
    
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
    webhookToggleBtn.Position = UDim2.new(0.075, 0, 0, 170)
    webhookToggleBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
    webhookToggleBtn.Text = "🔔 Webhook ON"
    webhookToggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    webhookToggleBtn.TextScaled = true
    webhookToggleBtn.Font = Enum.Font.Gotham
    webhookToggleBtn.Parent = mainFrame
    
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
    inputLabel.Position = UDim2.new(0.05, 0, 0, 205)
    inputLabel.BackgroundTransparency = 1
    inputLabel.Text = "Webhook:"
    inputLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    inputLabel.TextScaled = true
    inputLabel.Font = Enum.Font.Gotham
    inputLabel.Parent = mainFrame
    
    inputBox = Instance.new("TextBox")
    inputBox.Size = UDim2.new(0.6, 0, 0, 24)
    inputBox.Position = UDim2.new(0.35, 0, 0, 203)
    inputBox.BackgroundColor3 = Color3.fromRGB(50, 50, 70)
    inputBox.Text = ""
    inputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
    inputBox.TextScaled = true
    inputBox.Font = Enum.Font.Gotham
    inputBox.PlaceholderText = "URL webhook"
    inputBox.Parent = mainFrame
    local inCorner = Instance.new("UICorner")
    inCorner.CornerRadius = UDim.new(0, 4)
    inCorner.Parent = inputBox
    
    -- Set button
    setBtn = Instance.new("TextButton")
    setBtn.Size = UDim2.new(0.4, 0, 0, 24)
    setBtn.Position = UDim2.new(0.55, 0, 0, 233)
    setBtn.BackgroundColor3 = Color3.fromRGB(30, 60, 90)
    setBtn.Text = "Set"
    setBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    setBtn.TextScaled = true
    setBtn.Font = Enum.Font.Gotham
    setBtn.Parent = mainFrame
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
    
    -- Test button
    testBtn = Instance.new("TextButton")
    testBtn.Size = UDim2.new(0.4, 0, 0, 24)
    testBtn.Position = UDim2.new(0.05, 0, 0, 233)
    testBtn.BackgroundColor3 = Color3.fromRGB(60, 80, 30)
    testBtn.Text = "🧪 Test"
    testBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    testBtn.TextScaled = true
    testBtn.Font = Enum.Font.Gotham
    testBtn.Parent = mainFrame
    local testCorner = Instance.new("UICorner")
    testCorner.CornerRadius = UDim.new(0, 4)
    testCorner.Parent = testBtn
    
    testBtn.MouseButton1Click:Connect(function()
        if webhookURL == "" then
            statusLabel.Text = "⚠️ Set URL first"
            statusLabel.TextColor3 = Color3.fromRGB(255, 255, 0)
            print("⚠️ Belum ada URL webhook")
            task.wait(1.5)
            statusLabel.Text = isDetecting and "🟢 Detecting" or "🔴 Paused"
            return
        end
        
        print("🧪 Mengirim test webhook...")
        statusLabel.Text = "📤 Sending..."
        statusLabel.TextColor3 = Color3.fromRGB(255, 255, 0)
        
        local ok = sendWebhook(nil, true)
        if ok then
            statusLabel.Text = "✅ Test OK"
            statusLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
        else
            statusLabel.Text = "❌ Test failed"
            statusLabel.TextColor3 = Color3.fromRGB(255, 0, 0)
        end
        
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
    
    print("✅ UI created!")
end

-- ============================================================
-- MAIN
-- ============================================================
print("🎣 Fish It Weather Detector v5")
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

print("✅ Script ready! Press W to toggle detection.")
print("🔗 Masukkan URL webhook di UI, lalu klik Set dan Test.")
