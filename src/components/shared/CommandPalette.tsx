import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { navToolGroups } from "@/lib/tool-registry";

const commandGroups = [
  ...navToolGroups,
  {
    label: "Pages",
    tools: [
      { path: "/blog", label: "Blog" },
      { path: "/about", label: "About" },
    ],
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tools…" />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>
        {commandGroups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.tools.map((tool) => (
              <CommandItem
                key={tool.path}
                value={tool.label}
                onSelect={() => handleSelect(tool.path)}
              >
                {tool.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
