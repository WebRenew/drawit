export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: December 2024</p>

        <h2>Introduction</h2>
        <p>
          Drawit is an open-source collaborative whiteboard application operated by Webrenew LLC.
          This Privacy Policy explains how we collect, use, and protect your information when you use our service.
        </p>

        <h2>Information We Collect</h2>
        <p>To provide and improve our service, we may collect:</p>
        <ul>
          <li><strong>Account Information:</strong> Email address and authentication credentials when you create an account</li>
          <li><strong>Canvas Data:</strong> The diagrams, shapes, and content you create within the application</li>
          <li><strong>Chat History:</strong> Conversations with the AI assistant to provide context-aware assistance</li>
          <li><strong>Usage Data:</strong> Basic analytics to understand how the application is used and to improve performance</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>Your data is used solely to:</p>
        <ul>
          <li>Provide and maintain the Drawit service</li>
          <li>Save and restore your canvas work</li>
          <li>Enable AI-powered features and assistance</li>
          <li>Improve application performance and user experience</li>
        </ul>

        <h2>Data Storage</h2>
        <p>
          Your data is stored securely using industry-standard encryption and security practices.
          Canvas data may be stored locally in your browser and/or on our servers to enable features like
          persistence and collaboration.
        </p>

        <h2>No Advertising or Third-Party Sharing</h2>
        <p>
          <strong>We do not sell, rent, or share your personal information with third parties for advertising purposes.</strong>
          Your data is yours. We will never monetize your information through advertising or data brokerage.
        </p>

        <h2>Open Source</h2>
        <p>
          Drawit is open-source software released under the MIT License. You can review our code,
          verify our privacy practices, and even self-host the application if you prefer complete control
          over your data.
        </p>

        <h2>Data Retention</h2>
        <p>
          We retain your data for as long as your account is active or as needed to provide you with our services.
          You may request deletion of your account and associated data at any time by contacting us.
        </p>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Export your canvas data</li>
        </ul>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:
        </p>
        <address className="not-italic">
          <strong>Webrenew LLC</strong><br />
          6651 Rivers Ave Ste 100<br />
          North Charleston, SC<br />
          <a href="mailto:contact@webrenew.io">contact@webrenew.io</a>
        </address>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by
          posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
        </p>
      </div>
    </main>
  );
}
