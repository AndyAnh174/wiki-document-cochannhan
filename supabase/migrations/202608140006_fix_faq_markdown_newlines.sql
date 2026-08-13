-- The initial seed used the two visible characters "\n". Convert them to
-- real line feeds so Markdown lists and paragraphs render correctly.
update public.faq_entries
set answer = replace(answer, E'\\n', E'\n')
where strpos(answer, E'\\n') > 0;
