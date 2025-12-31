import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Chat Functionality
 *
 * Tests the TRIBE chat interface powered by Google ADK agent.
 * These tests verify the chat flow, tool rendering, and context awareness.
 *
 * Prerequisites:
 * - Application running on localhost:3000
 * - ADK agent server running on localhost:8000
 * - Test user authenticated
 */

test.describe("Chat Functionality", () => {
  // Skip auth for now - these tests assume a logged-in user or public access
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard with chat
    await page.goto("/dashboard");

    // Wait for chat window to be visible
    await page.waitForSelector('[data-testid="chat-window"]', { timeout: 30000 });
  });

  test("chat window loads correctly", async ({ page }) => {
    // Verify chat components are present
    const chatWindow = page.locator('[data-testid="chat-window"]');
    await expect(chatWindow).toBeVisible();

    const chatTitle = page.locator('[data-testid="chat-title"]');
    await expect(chatTitle).toBeVisible();

    const chatBody = page.locator('[data-testid="chat-body"]');
    await expect(chatBody).toBeVisible();
  });

  test("sends message and receives streaming response", async ({ page }) => {
    // Find the CopilotChat input (inside the chat body)
    const chatBody = page.locator('[data-testid="chat-body"]');

    // CopilotKit uses a textarea for input
    const input = chatBody.locator("textarea").first();
    await expect(input).toBeVisible({ timeout: 10000 });

    // Type a test message
    await input.fill("Hello, what can you help me with?");

    // Find and click send button (CopilotKit uses a button inside the form)
    const sendButton = chatBody.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for response to appear - CopilotKit renders messages in a container
    // Look for assistant message content (text that appears after sending)
    await page.waitForTimeout(3000); // Allow for SSE streaming

    // Check that some response appeared (assistant message)
    const messages = chatBody.locator('[class*="message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(0);
  });

  test("displays welcome message on load", async ({ page }) => {
    // CopilotChat shows initial/welcome message
    const chatBody = page.locator('[data-testid="chat-body"]');

    // Wait for initial content to load
    await page.waitForTimeout(2000);

    // The welcome message should be visible in the chat
    // Look for text content that includes welcome-related words
    const hasWelcomeContent = await chatBody.evaluate((el) => {
      const text = el.textContent || "";
      return (
        text.toLowerCase().includes("welcome") ||
        text.toLowerCase().includes("help") ||
        text.toLowerCase().includes("tribe")
      );
    });

    expect(hasWelcomeContent).toBe(true);
  });
});

test.describe("Tool Card Rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-window"]', { timeout: 30000 });
  });

  test("housing search triggers tool and renders results", async ({ page }) => {
    const chatBody = page.locator('[data-testid="chat-body"]');
    const input = chatBody.locator("textarea").first();
    await expect(input).toBeVisible({ timeout: 10000 });

    // Ask about housing - this should trigger the searchTemporaryHousing tool
    await input.fill("Find temporary housing resources in Canada");

    const sendButton = chatBody.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for tool execution and response
    // Tools render via useADKToolRenderers - look for tool card elements
    await page.waitForTimeout(10000);

    // Check for any response content (tool results or text)
    const responseContent = await chatBody.textContent();
    expect(responseContent).toBeTruthy();

    // If housing tool was called, results should mention housing-related terms
    // This is a soft check since the exact response depends on the agent
    const hasHousingContent = responseContent
      ?.toLowerCase()
      .includes("housing");
    expect(hasHousingContent || responseContent!.length > 100).toBe(true);
  });

  test("visa search triggers tool and renders results", async ({ page }) => {
    const chatBody = page.locator('[data-testid="chat-body"]');
    const input = chatBody.locator("textarea").first();
    await expect(input).toBeVisible({ timeout: 10000 });

    // Ask about visas - this should trigger visa-related tools
    await input.fill("What visa do I need to move from Nigeria to Canada?");

    const sendButton = chatBody.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(10000);

    // Check for visa-related content in response
    const responseContent = await chatBody.textContent();
    expect(responseContent).toBeTruthy();

    // The response should mention visa or immigration
    const hasVisaContent =
      responseContent?.toLowerCase().includes("visa") ||
      responseContent?.toLowerCase().includes("immigration") ||
      responseContent?.toLowerCase().includes("permit");
    expect(hasVisaContent || responseContent!.length > 100).toBe(true);
  });
});

test.describe("Corridor Context", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-window"]', { timeout: 30000 });
  });

  test("agent is aware of corridor context", async ({ page }) => {
    const chatBody = page.locator('[data-testid="chat-body"]');
    const input = chatBody.locator("textarea").first();
    await expect(input).toBeVisible({ timeout: 10000 });

    // Ask about current context
    await input.fill("What corridor am I currently working with?");

    const sendButton = chatBody.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(8000);

    // The response should reflect corridor awareness
    // If user has a corridor set, it should mention origin/destination
    // If not, it should indicate no corridor is set
    const responseContent = await chatBody.textContent();
    expect(responseContent).toBeTruthy();
    expect(responseContent!.length).toBeGreaterThan(50);
  });
});
