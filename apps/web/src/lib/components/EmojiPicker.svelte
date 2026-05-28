<script lang="ts">
  interface Props {
    onselect: (emoji: string) => void;
    onclear?: () => void;
    current?: string;
  }

  let { onselect, onclear, current = '' }: Props = $props();

  let query = $state('');

  const CATEGORIES: { label: string; emojis: string[] }[] = [
    {
      label: 'Common',
      emojis: ['📝','📋','📊','📈','💡','🔥','⭐','✅','🎯','📌','💬','🗒️','🗓️','📅','🔔','📣']
    },
    {
      label: 'Work',
      emojis: ['💼','🏢','📞','📧','🤝','⏰','💹','🔗','🔐','🗝️','📤','📥','🗂️','📂','📁','🏆']
    },
    {
      label: 'Creative',
      emojis: ['🎨','🎭','🎬','🎵','🎸','✏️','🖊️','🖌️','📸','🎪','🎤','🎼','🎹','🎺','🎻','🖼️']
    },
    {
      label: 'Tech',
      emojis: ['💻','📱','🖥️','⌨️','🖱️','💾','🌐','🔧','🔌','⚡','🚀','🤖','🛸','🧪','🔬','🔭']
    },
    {
      label: 'Nature',
      emojis: ['🌍','🌱','🌿','🍀','🌸','🌺','🌻','☀️','🌙','🌊','🔮','❄️','🌈','⚡','🦋','🐝']
    },
    {
      label: 'People',
      emojis: ['👤','👥','🧑‍💻','👩‍🎨','🧑‍🏫','👨‍💼','🧑‍🔬','👩‍🍳','🧑‍🎤','👩‍🚀','🧙','🦸','🧑‍🤝‍🧑','🫂','🤔','💪']
    },
    {
      label: 'Objects',
      emojis: ['📚','📖','📰','🔑','🧲','💎','👑','🏺','🧩','🎲','🃏','🎮','🏅','🥇','🎁','🛡️']
    },
    {
      label: 'Places',
      emojis: ['🏠','🏔️','🏕️','🏖️','🏛️','🏗️','🌆','🌃','🗺️','⚓','🏟️','🌋','🗼','🗽','🏰','🕌']
    }
  ];

  let allEmojis = $derived(
    CATEGORIES.flatMap(c => c.emojis.map(e => ({ emoji: e, cat: c.label })))
  );

  let filtered = $derived(
    query.trim().length === 0
      ? null
      : allEmojis.filter(({ emoji }) => emoji.includes(query.trim()))
  );
</script>

<div
  class="w-64 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
  onclick={(e) => e.stopPropagation()}
  role="dialog"
  tabindex="-1"
  onkeydown={(e) => e.stopPropagation()}
>
  <!-- Search -->
  <div class="border-b border-slate-100 px-3 py-2">
    <input
      type="search"
      bind:value={query}
      placeholder="Search emoji…"
      class="w-full rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400 border border-slate-200"
    />
  </div>

  <!-- Emoji grid -->
  <div class="max-h-60 overflow-y-auto px-2 py-2 space-y-2">
    {#if filtered}
      <div class="flex flex-wrap gap-0.5">
        {#each filtered as { emoji } (emoji)}
          <button
            type="button"
            onclick={() => onselect(emoji)}
            class="h-8 w-8 rounded-lg text-lg leading-none flex items-center justify-center
              hover:bg-violet-50 transition-colors {current === emoji ? 'bg-violet-100 ring-1 ring-violet-400' : ''}"
          >
            {emoji}
          </button>
        {/each}
        {#if filtered.length === 0}
          <p class="w-full py-3 text-center text-xs text-slate-400 italic">No results</p>
        {/if}
      </div>
    {:else}
      {#each CATEGORIES as cat (cat.label)}
        <div>
          <p class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{cat.label}</p>
          <div class="flex flex-wrap gap-0.5">
            {#each cat.emojis as emoji (emoji)}
              <button
                type="button"
                onclick={() => onselect(emoji)}
                class="h-8 w-8 rounded-lg text-lg leading-none flex items-center justify-center
                  hover:bg-violet-50 transition-colors {current === emoji ? 'bg-violet-100 ring-1 ring-violet-400' : ''}"
              >
                {emoji}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Footer actions -->
  <div class="border-t border-slate-100 px-3 py-1.5 flex items-center justify-between">
    {#if current && onclear}
      <button
        type="button"
        onclick={onclear}
        class="text-xs text-slate-400 hover:text-red-400 transition-colors"
      >
        Remove icon
      </button>
    {:else}
      <span></span>
    {/if}
    <span class="text-[10px] text-slate-300">Click to select</span>
  </div>
</div>
