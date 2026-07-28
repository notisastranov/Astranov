let meta = #{
    name: "midnight-greek-ship",
    description: "One SpaceNet fix per Athens midnight from usage/handoffs + SPECS pain",
    phases: [
        #{ title: "Read", detail: "SPECS, continuity, usage packet if present, recent git" },
        #{ title: "Pick", detail: "Choose exactly one highest-pain fix" },
        #{ title: "Ship", detail: "Implement, probe, commit message ready" },
    ],
};

let pick_schema = #{
    "type": "object",
    "required": ["title", "files", "why"],
    "properties": #{
        "title": #{ "type": "string" },
        "files": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 8 },
        "why": #{ "type": "string" },
        "acceptance": #{ "type": "string" },
    },
};

let result_schema = #{
    "type": "object",
    "required": ["done", "summary", "commit_msg"],
    "properties": #{
        "done": #{ "type": "boolean" },
        "summary": #{ "type": "string" },
        "commit_msg": #{ "type": "string" },
        "risks": #{ "type": "string" },
    },
};

// Optional: paste usage export into args.packet or path args.packet_path
let packet = if args == () { "" } else if args.packet == () { "" } else { args.packet };
let note = if args == () { "" } else if args.note == () { "" } else { args.note };

phase("Read");
let ctx = agent(#{
    prompt: "You are shipping ONE fix for Astranov SpaceNet (live js/spacenet/* only). "
        + "Read SPECS.md (P4 first loop, P4-U usage ship, P0-D zero dummy), astranov-continuity.js, "
        + "js/spacenet/market.js, usage.js, ai.js, profiles.js placeOrder. "
        + "If present, read data/usage-latest.md or args packet. "
        + "Git log -5 --oneline. Summarize top pain for marketplace first-loop + click/map/AI. "
        + "Usage packet follows:\n" + packet + "\nExtra note:\n" + note,
    label: "read-context",
});

phase("Pick");
let pick = agent(#{
    prompt: "From this context, pick EXACTLY ONE shippable fix for tonight (Athens midnight cadence). "
        + "Prefer open handoffs and first-loop friction. No dummy NPCs. No multi-feature dump. "
        + "Context:\n" + ctx,
    label: "pick-one",
    schema: pick_schema,
});

phase("Ship");
let ship = agent(#{
    prompt: "Implement this single fix in the Astranov repo under js/spacenet/* (and SPECS/continuity if law changes). "
        + "Title: " + pick.title + "\nWhy: " + pick.why + "\nFiles hint: " + pick.files
        + "\nAcceptance: " + pick.acceptance
        + "\nDo the code change. Do not invent NPC shops. Probe with curl if possible for live JS. "
        + "Return done, summary, commit_msg, risks.",
    label: "implement-one",
    schema: result_schema,
});

complete(#{
    pick: pick,
    ship: ship,
    rule: "one fix per Europe/Athens midnight",
});
