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
badd +5 ~/Programming/Game-Gauntlet-Server/src/module/retroachievements/retroach.service.ts
badd +17 ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.service.ts
badd +102 ~/Programming/Game-Gauntlet-Server/src/module/igdb/utils/igdb.ts
badd +1 ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-games.schema.ts
badd +12 ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-covers.schema.ts
badd +1 ~/Programming/Game-Gauntlet-Server/src/models/igdb.ts
badd +14 ~/Programming/Game-Gauntlet-Server/src/module/igdb/igdb.module.ts
argglobal
%argdel
$argadd retroach.service.ts
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabrewind
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
exe 'vert 1resize ' . ((&columns * 87 + 88) / 176)
exe 'vert 2resize ' . ((&columns * 88 + 88) / 176)
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
let s:l = 74 - ((33 * winheight(0) + 25) / 51)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 74
normal! 059|
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
let s:l = 17 - ((16 * winheight(0) + 25) / 51)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 17
normal! 05|
wincmd w
exe 'vert 1resize ' . ((&columns * 87 + 88) / 176)
exe 'vert 2resize ' . ((&columns * 88 + 88) / 176)
tabnext
edit ~/Programming/Game-Gauntlet-Server/src/module/igdb/schemas/igdb-games.schema.ts
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
exe 'vert 1resize ' . ((&columns * 87 + 88) / 176)
exe 'vert 2resize ' . ((&columns * 88 + 88) / 176)
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
let s:l = 1 - ((0 * winheight(0) + 25) / 51)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
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
let s:l = 12 - ((11 * winheight(0) + 25) / 51)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 12
normal! 015|
wincmd w
exe 'vert 1resize ' . ((&columns * 87 + 88) / 176)
exe 'vert 2resize ' . ((&columns * 88 + 88) / 176)
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
let s:l = 109 - ((33 * winheight(0) + 25) / 51)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 109
normal! 016|
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
let s:l = 14 - ((13 * winheight(0) + 25) / 51)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 14
normal! 055|
tabnext 1
if exists('s:wipebuf') && len(win_findbuf(s:wipebuf)) == 0 && getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20
let &shortmess = s:shortmess_save
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
