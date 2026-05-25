<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;

  let tab: 'login' | 'register' = 'login';
  let loading = false;
</script>

<svelte:head>
  <title>{tab === 'login' ? 'Sign in' : 'Create account'} — Notion Clone</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
  <div class="w-full max-w-sm">

    <!-- Logo / title -->
    <div class="mb-8 text-center">
      <div class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white text-2xl shadow-lg">
        📝
      </div>
      <h1 class="text-2xl font-bold text-slate-900">Notion Clone</h1>
      <p class="mt-1 text-sm text-slate-500">A collaborative workspace</p>
    </div>

    <!-- Card -->
    <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

      <!-- Tabs -->
      <div class="mb-6 flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          class="flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors
            {tab === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
          on:click={() => { tab = 'login'; }}
        >Sign in</button>
        <button
          type="button"
          class="flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors
            {tab === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
          on:click={() => { tab = 'register'; }}
        >Create account</button>
      </div>

      <!-- Error banner -->
      {#if form?.error}
        <div class="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {form.error}
        </div>
      {/if}

      <!-- Login form -->
      {#if tab === 'login'}
        <form
          method="POST"
          action="?/login"
          use:enhance={() => {
            loading = true;
            return async ({ update }) => { loading = false; await update(); };
          }}
          class="space-y-4"
        >
          <div>
            <label for="login-email" class="mb-1.5 block text-xs font-medium text-slate-700">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autocomplete="email"
              value={form?.email ?? ''}
              placeholder="you@example.com"
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 transition"
            />
          </div>
          <div>
            <label for="login-password" class="mb-1.5 block text-xs font-medium text-slate-700">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            class="mt-1 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

      <!-- Register form -->
      {:else}
        <form
          method="POST"
          action="?/register"
          use:enhance={() => {
            loading = true;
            return async ({ update }) => { loading = false; await update(); };
          }}
          class="space-y-4"
        >
          <div>
            <label for="reg-name" class="mb-1.5 block text-xs font-medium text-slate-700">
              Display name <span class="text-slate-400">(optional)</span>
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              autocomplete="name"
              value={form?.name ?? ''}
              placeholder="Your name"
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 transition"
            />
          </div>
          <div>
            <label for="reg-email" class="mb-1.5 block text-xs font-medium text-slate-700">Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              autocomplete="email"
              value={form?.email ?? ''}
              placeholder="you@example.com"
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 transition"
            />
          </div>
          <div>
            <label for="reg-password" class="mb-1.5 block text-xs font-medium text-slate-700">
              Password <span class="text-slate-400">(min. 8 characters)</span>
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            class="mt-1 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>
