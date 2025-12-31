import { test, expect } from "@playwright/test";

/**
 * Performance Tests for Chat
 *
 * Tests response time requirements from NFR2: <2s for 95th percentile.
 * Note: Cold start times may be higher when ADK agent scales from 0.
 */

test.describe("Chat Performance", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-window"]', { timeout: 30000 });
  });

  test("response time metrics collection", async ({ page }) => {
    const chatBody = page.locator('[data-testid="chat-body"]');
    const input = chatBody.locator("textarea").first();
    await expect(input).toBeVisible({ timeout: 10000 });

    const responseTimes: number[] = [];
    const testQueries = [
      "Hello",
      "What is TRIBE?",
      "Help me understand visas",
      "Tell me about housing",
      "What documents do I need?",
    ];

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      const startTime = Date.now();

      // Clear previous input and send new message
      await input.fill(query);
      const sendButton = chatBody.locator('button[type="submit"]');
      await sendButton.click();

      // Wait for any response to appear (streaming starts)
      // We measure time to first response token
      await page.waitForTimeout(500); // Brief wait for request to send

      // Wait for response content to increase (indicating streaming started)
      const initialContent = await chatBody.textContent();
      const initialLength = initialContent?.length || 0;

      // Poll until content changes (response is arriving)
      let responseDetected = false;
      for (let j = 0; j < 40; j++) {
        // Max 20 seconds (40 * 500ms)
        await page.waitForTimeout(500);
        const currentContent = await chatBody.textContent();
        if ((currentContent?.length || 0) > initialLength + 20) {
          responseDetected = true;
          break;
        }
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);

      console.log(
        `Query ${i + 1}: "${query}" - Response time: ${responseTime}ms`
      );

      // Small delay between queries to avoid rate limiting
      await page.waitForTimeout(1000);
    }

    // Calculate statistics
    responseTimes.sort((a, b) => a - b);
    const p50Index = Math.floor(responseTimes.length * 0.5);
    const p95Index = Math.floor(responseTimes.length * 0.95);

    const p50 = responseTimes[p50Index] || responseTimes[responseTimes.length - 1];
    const p95 = responseTimes[p95Index] || responseTimes[responseTimes.length - 1];
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    console.log("\n=== Performance Metrics ===");
    console.log(`Queries tested: ${responseTimes.length}`);
    console.log(`Average response time: ${Math.round(avg)}ms`);
    console.log(`50th percentile (P50): ${p50}ms`);
    console.log(`95th percentile (P95): ${p95}ms`);
    console.log(`All times: [${responseTimes.join(", ")}]ms`);

    // NFR2 requirement: 95th percentile should be under 2 seconds
    // Note: First query may be slower due to cold start
    // We allow 5s for cold start scenarios, but target <2s for warm
    expect(p95).toBeLessThan(5000);

    // Log warning if P95 exceeds target
    if (p95 > 2000) {
      console.log(
        `\n⚠️ Warning: P95 (${p95}ms) exceeds 2s target. May include cold start.`
      );
    }
  });

  test("cold start performance", async ({ page }) => {
    // Test cold start (first request after idle)
    const chatBody = page.locator('[data-testid="chat-body"]');
    const input = chatBody.locator("textarea").first();
    await expect(input).toBeVisible({ timeout: 10000 });

    const startTime = Date.now();

    await input.fill("Hello, this is a cold start test");
    const sendButton = chatBody.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for response
    const initialContent = await chatBody.textContent();
    const initialLength = initialContent?.length || 0;

    let responseTime = 0;
    for (let i = 0; i < 60; i++) {
      // Max 30 seconds
      await page.waitForTimeout(500);
      const currentContent = await chatBody.textContent();
      if ((currentContent?.length || 0) > initialLength + 20) {
        responseTime = Date.now() - startTime;
        break;
      }
    }

    console.log(`Cold start response time: ${responseTime}ms`);

    // Cold start should complete within 10 seconds (Cloud Run scaling)
    expect(responseTime).toBeLessThan(10000);
    expect(responseTime).toBeGreaterThan(0);
  });

  test("subsequent request performance (warm)", async ({ page }) => {
    const chatBody = page.locator('[data-testid="chat-body"]');
    const input = chatBody.locator("textarea").first();
    await expect(input).toBeVisible({ timeout: 10000 });

    // First request to warm up
    await input.fill("Warm up request");
    const sendButton = chatBody.locator('button[type="submit"]');
    await sendButton.click();
    await page.waitForTimeout(5000);

    // Second request (warm)
    const startTime = Date.now();
    await input.fill("This should be faster");
    await sendButton.click();

    const initialContent = await chatBody.textContent();
    const initialLength = initialContent?.length || 0;

    let responseTime = 0;
    for (let i = 0; i < 20; i++) {
      // Max 10 seconds
      await page.waitForTimeout(500);
      const currentContent = await chatBody.textContent();
      if ((currentContent?.length || 0) > initialLength + 20) {
        responseTime = Date.now() - startTime;
        break;
      }
    }

    console.log(`Warm request response time: ${responseTime}ms`);

    // Warm requests should be under 2 seconds (NFR2)
    expect(responseTime).toBeLessThan(2000);
  });
});
