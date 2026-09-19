import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe.serial('M12 Critical Flows & Accessibility', () => {
  const targetProjectName = `New E2E Target Project ${Date.now()}`;
  const testEmail = `newuser_${Date.now()}@example.com`;
  const testUsername = `new_e2e_user_${Date.now()}`;

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Flow 1: Signup -> Verify -> Onboarding -> Profile + A11y', async ({ page }) => {
    await page.goto('/auth/signup');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for the UI to indicate successful registration or redirect
    await page.waitForURL(/.*verify.*/, { timeout: 10000 }).catch(() => {});
    
    // Test environment DB setup: retrieve the real VerificationToken to simulate clicking the email link
    let tokenRecord = null;
    for (let i = 0; i < 10; i++) {
      tokenRecord = await prisma.verificationToken.findFirst({ where: { email: testEmail } });
      if (tokenRecord) break;
      await new Promise(r => setTimeout(r, 1000));
    }
    expect(tokenRecord).toBeTruthy();

    await page.goto(`/auth/verify-email?token=${tokenRecord!.token}`);
    await page.waitForURL(/.*login.*/, { timeout: 10000 }).catch(() => {});

    // Login and finish onboarding
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Expect onboarding redirect (since profile is missing)
    await expect(page).toHaveURL(/.*onboarding.*/);
    await page.fill('input[name="displayName"]', 'New E2E Verified User');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('textarea[name="bio"]', 'A passionate test user');
    await page.click('button[type="submit"]');
    
    // Profile
    await expect(page).toHaveURL(/.*profile.*/);
    await expect(page.locator('text=New E2E Verified User')).toBeVisible();
  });

  test('Flow 2: Project Publish -> Recommendation + A11y', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'e2e1@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/projects/new');
    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);

    await page.fill('input[name="name"]', targetProjectName);
    await page.fill('textarea[name="description"]', 'E2E Target Description');
    await page.click('button:has-text("Publish")');

    await expect(page).toHaveURL(/.*projects\/.*/);
    await expect(page.locator(`text=${targetProjectName}`)).toBeVisible();
  });

  test('Flow 3: Apply -> Accept -> Workspace', async ({ page, context }) => {
    // 1. Developer (e2e2) applies for the project
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'e2e2@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/explore/projects');
    
    // Search for the project created by Flow 2
    await page.fill('input[placeholder*="Search"]', targetProjectName);
    await page.keyboard.press('Enter');
    
    // Click on the project card
    await page.click(`text=${targetProjectName}`);
    
    // Click apply
    await page.click('button:has-text("Apply")');
    // Ensure form is filled if a message is required
    await page.fill('textarea[name="message"]', 'I would love to help!');
    await page.click('button:has-text("Submit Application")');
    
    await expect(page.locator('text=Application submitted')).toBeVisible();

    // 2. Owner (e2e1) accepts the application
    await context.clearCookies();
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'e2e1@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Go to project applications
    await page.goto('/projects'); // Assuming a dashboard exists
    await page.click(`text=${targetProjectName}`);
    await page.click('text=Applications');
    
    // Accept developer
    await page.click('text=E2E Developer 2');
    await page.click('button:has-text("Accept")');
    
    // Verify Workspace is created
    await expect(page.locator('text=Workspace')).toBeVisible();
    await page.click('text=Workspace');
    await expect(page.locator('text=Collaborators')).toBeVisible();
  });

  test('Flow 4: Invite -> Accept -> Workspace', async ({ page, context }) => {
    // 1. Owner (e2e1) invites developer (e2e3)
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'e2e1@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/explore/developers');
    await page.fill('input[placeholder*="Search"]', 'E2E Developer 3');
    await page.keyboard.press('Enter');
    
    await page.click('text=E2E Developer 3');
    await page.click('button:has-text("Invite")');
    await page.selectOption('select[name="projectId"]', { label: targetProjectName });
    await page.fill('textarea[name="message"]', 'Join my project!');
    await page.click('button:has-text("Send Invitation")');
    
    await expect(page.locator('text=Invitation sent')).toBeVisible();

    // 2. Developer (e2e3) accepts
    await context.clearCookies();
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'e2e3@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/invitations');
    await page.click(`text=${targetProjectName}`);
    await page.click('button:has-text("Accept")');
    
    // Verify Workspace
    await expect(page.locator('text=Workspace')).toBeVisible();
  });

  test('Flow 5: Report -> Admin Resolution + A11y', async ({ page, context }) => {
    // User reports something
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'e2e1@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/explore/developers');
    await page.click('text=E2E Developer 3');
    await page.click('button[aria-label="Report"]');
    
    await page.selectOption('select[name="reason"]', { value: 'spam' });
    await page.fill('textarea[name="description"]', 'Looks like spam');
    await page.click('button:has-text("Submit Report")');
    
    await expect(page.locator('text=Report submitted')).toBeVisible();

    // Admin resolves it
    await context.clearCookies();
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/admin/reports');
    
    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);

    await page.click('text=Looks like spam');
    await page.click('button:has-text("Resolve")');
    await page.selectOption('select[name="status"]', { value: 'actioned' });
    await page.fill('textarea[name="resolutionNotes"]', 'Handled spammer');
    await page.click('button:has-text("Confirm Resolution")');
    
    await expect(page.locator('text=actioned')).toBeVisible();
    await expect(page.locator('text=Looks like spam')).not.toBeVisible();
  });
});
