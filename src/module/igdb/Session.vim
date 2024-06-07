let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/Programming/Game-Gauntlet-Server/src/module/retroachievements
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
let s:shortmess_save = &shortmess
if &shortmess =~ 'A'
  set shortmess=aoOA
else
  set shortmess=aoO
endif
badd +94 ~/Programming/Game-Gauntlet-Server/src/module/retroachievements/retroach.service.ts
badd +145 ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.service.ts
badd +101 ~/Programming/Game-Gauntlet-Server/src/module/igdb/utils/igdb.ts
badd +1 ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-games.schema.ts
badd +17 ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-covers.schema.ts
badd +1 ~/Programming/Game-Gauntlet-Server/src/models/igdb.ts
badd +19 ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.module.ts
badd +1 ~/Programming/Game-Gauntlet-Server/src/module/igdb/interface/igdb.interface.ts
badd +18 ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-platforms.schema.ts
badd +4 ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-genres.schema.ts
badd +11 ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-families.schema.ts
badd +36 ~/Programming/Game-Gauntlet-Server/src/module/retroachievements/controllers/retroach.controller.ts
badd +12 ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-modes.schema.ts
badd +12 ~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb.controller.ts
badd +23 ~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb-parser.controller.ts
argglobal
%argdel
$argadd igdb.controller.spec.ts
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabrewind
edit ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-games.schema.ts
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd _ | wincmd |
split
1wincmd k
wincmd w
wincmd w
wincmd _ | wincmd |
split
1wincmd k
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe '1resize ' . ((&lines * 30 + 32) / 65)
exe 'vert 1resize ' . ((&columns * 99 + 100) / 201)
exe '2resize ' . ((&lines * 31 + 32) / 65)
exe 'vert 2resize ' . ((&columns * 99 + 100) / 201)
exe '3resize ' . ((&lines * 30 + 32) / 65)
exe 'vert 3resize ' . ((&columns * 101 + 100) / 201)
exe '4resize ' . ((&lines * 31 + 32) / 65)
exe 'vert 4resize ' . ((&columns * 101 + 100) / 201)
argglobal
balt ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.service.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 16 - ((3 * winheight(0) + 15) / 30)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 16
normal! 015|
wincmd w
argglobal
if bufexists(fnamemodify("~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-genres.schema.ts", ":p")) | buffer ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-genres.schema.ts | else | edit ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-genres.schema.ts | endif
if &buftype ==# 'terminal'
  silent file ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-genres.schema.ts
endif
balt ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-games.schema.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 18 - ((17 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 18
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-covers.schema.ts", ":p")) | buffer ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-covers.schema.ts | else | edit ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-covers.schema.ts | endif
if &buftype ==# 'terminal'
  silent file ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-covers.schema.ts
endif
balt ~/Programming/Game-Gauntlet-Server/src/models/igdb.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 15 - ((14 * winheight(0) + 15) / 30)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 15
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-platforms.schema.ts", ":p")) | buffer ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-platforms.schema.ts | else | edit ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-platforms.schema.ts | endif
if &buftype ==# 'terminal'
  silent file ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-platforms.schema.ts
endif
balt ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-modes.schema.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 18 - ((17 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 18
normal! 020|
wincmd w
exe '1resize ' . ((&lines * 30 + 32) / 65)
exe 'vert 1resize ' . ((&columns * 99 + 100) / 201)
exe '2resize ' . ((&lines * 31 + 32) / 65)
exe 'vert 2resize ' . ((&columns * 99 + 100) / 201)
exe '3resize ' . ((&lines * 30 + 32) / 65)
exe 'vert 3resize ' . ((&columns * 101 + 100) / 201)
exe '4resize ' . ((&lines * 31 + 32) / 65)
exe 'vert 4resize ' . ((&columns * 101 + 100) / 201)
tabnext
edit ~/Programming/Game-Gauntlet-Server/src/module/igdb/utils/igdb.ts
argglobal
balt ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.service.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 101 - ((40 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 101
normal! 072|
tabnext
edit ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.module.ts
argglobal
balt ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-covers.schema.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 1 - ((0 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 040|
tabnext
edit ~/Programming/Game-Gauntlet-Server/src/module/retroachievements/controllers/retroach.controller.ts
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
wincmd _ | wincmd |
split
1wincmd k
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 100 + 100) / 201)
exe '2resize ' . ((&lines * 30 + 32) / 65)
exe 'vert 2resize ' . ((&columns * 100 + 100) / 201)
exe '3resize ' . ((&lines * 31 + 32) / 65)
exe 'vert 3resize ' . ((&columns * 100 + 100) / 201)
argglobal
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 23 - ((22 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 23
normal! 041|
wincmd w
argglobal
if bufexists(fnamemodify("~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb.controller.ts", ":p")) | buffer ~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb.controller.ts | else | edit ~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb.controller.ts | endif
if &buftype ==# 'terminal'
  silent file ~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb.controller.ts
endif
balt ~/Programming/Game-Gauntlet-Server/src/module/retroachievements/controllers/retroach.controller.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 49 - ((0 * winheight(0) + 15) / 30)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 49
normal! 059|
wincmd w
argglobal
if bufexists(fnamemodify("~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb-parser.controller.ts", ":p")) | buffer ~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb-parser.controller.ts | else | edit ~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb-parser.controller.ts | endif
if &buftype ==# 'terminal'
  silent file ~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb-parser.controller.ts
endif
balt ~/Programming/Game-Gauntlet-Server/src/module/igdb/controllers/igdb.controller.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 23 - ((22 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 23
normal! 020|
wincmd w
exe 'vert 1resize ' . ((&columns * 100 + 100) / 201)
exe '2resize ' . ((&lines * 30 + 32) / 65)
exe 'vert 2resize ' . ((&columns * 100 + 100) / 201)
exe '3resize ' . ((&lines * 31 + 32) / 65)
exe 'vert 3resize ' . ((&columns * 100 + 100) / 201)
tabnext
edit ~/Programming/Game-Gauntlet-Server/src/module/retroachievements/retroach.service.ts
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 99 + 100) / 201)
exe 'vert 2resize ' . ((&columns * 101 + 100) / 201)
argglobal
balt ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.service.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 111 - ((23 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 111
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.service.ts", ":p")) | buffer ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.service.ts | else | edit ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.service.ts | endif
if &buftype ==# 'terminal'
  silent file ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.service.ts
endif
balt ~/Programming/Game-Gauntlet-Server/src/module/retroachievements/retroach.service.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 303 - ((0 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 303
normal! 041|
wincmd w
exe 'vert 1resize ' . ((&columns * 99 + 100) / 201)
exe 'vert 2resize ' . ((&columns * 101 + 100) / 201)
tabnext 5
if exists('s:wipebuf') && len(win_findbuf(s:wipebuf)) == 0 && getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20
let &shortmess = s:shortmess_save
let &winminheight = s:save_winminheight
let &winminwidth = s:save_winminwidth
let s:sx = expand("<sfile>:p:r")."x.vim"
if filereadable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &g:so = s:so_save | let &g:siso = s:siso_save
set hlsearch
nohlsearch
let g:this_session = v:this_session
let g:this_obsession = v:this_session
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
