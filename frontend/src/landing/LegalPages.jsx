import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FlowArrow } from '@phosphor-icons/react';
import './landing.css';

function LegalShell({ title, subtitle, children }) {
  return (
    <div className="lp-root min-h-screen bg-[#000000] text-white py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#181818] border border-[#272727] hover:bg-[#1F1F1F] text-white button-sm lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft size={14} weight="bold" aria-hidden="true" />
            <span>Back to home</span>
          </Link>

          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
              <FlowArrow size={18} weight="bold" aria-hidden="true" />
            </span>
            <span className="title-4">FlowForge OS</span>
          </Link>
        </header>

        <main className="bg-[#181818] border border-[#272727] rounded-3xl p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="heading-3 text-white">{title}</h1>
            <p className="caption-2 text-[#9B9B9B]">{subtitle}</p>
          </div>
          <div className="space-y-4">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy policy"
      subtitle="How FlowForge OS handles local workflow data, credentials, and essential browser storage."
    >
      <section className="space-y-2">
        <h2 className="title-2 text-white">Local first execution</h2>
        <p className="body-6 text-[#9B9B9B]">
          When running the open source studio on your own hardware, workflows, uploaded PDF files, vector chunks, and Qwen prompts stay on your machine and communicate only with your configured MongoDB and Ollama endpoints.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="title-2 text-white">Encrypted secret vault</h2>
        <p className="body-6 text-[#9B9B9B]">
          API keys and SMTP passwords submitted through the Secrets Vault are encrypted with AES 256 GCM before persistence and decrypted in server memory only while an execution resolves template variables.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="title-2 text-white">Browser storage</h2>
        <p className="body-6 text-[#9B9B9B]">
          Essential local storage holds your JWT session token and storage notice acknowledgement. No advertising pixels or third party analytics trackers are loaded.
        </p>
      </section>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell
      title="Terms of service"
      subtitle="Licensing and responsible usage guidelines for FlowForge OS."
    >
      <section className="space-y-2">
        <h2 className="title-2 text-white">MIT open source license</h2>
        <p className="body-6 text-[#9B9B9B]">
          The community edition of FlowForge OS is distributed under the MIT License without warranty of any kind. You are free to inspect, modify, and self host the backend and frontend across personal or commercial systems.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="title-2 text-white">Responsible workflow automation</h2>
        <p className="body-6 text-[#9B9B9B]">
          Operators are responsible for securing their environment secrets, configuring valid SMTP targets, and respecting rate limits on external REST endpoints invoked from workflow nodes.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="title-2 text-white">Managed tier early access</h2>
        <p className="body-6 text-[#9B9B9B]">
          Managed Cloud Studio Pro and Enterprise VPC pricing and service terms will be provided directly to early access registrants prior to paid onboarding.
        </p>
      </section>
    </LegalShell>
  );
}

export function NotFoundPage() {
  return (
    <div className="lp-root min-h-screen bg-[#000000] text-white flex items-center justify-center p-6">
      <main className="max-w-lg w-full bg-[#181818] border border-[#272727] rounded-3xl p-8 space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mx-auto">
          <FlowArrow size={24} weight="bold" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="caption-3 lp-mono text-[#9B9B9B]">Error 404</p>
          <h1 className="heading-3 text-white">Route not found in this workspace</h1>
          <p className="body-6 text-[#9B9B9B]">
            The page you requested does not exist. Return to the FlowForge OS landing page or open the authentication studio.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-white text-black hover:bg-[#E5E5E5] button-sm lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft size={14} weight="bold" aria-hidden="true" />
            <span>Return home</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#000000] border border-[#272727] hover:bg-[#1F1F1F] text-white button-sm lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span>Open studio</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
