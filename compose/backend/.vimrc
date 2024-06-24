set nocp " use vim settings, not vi settings"
set splitright

filetype plugin on
set autoread
set ffs=unix,mac,dos

set encoding=utf-8
set backspace=indent,eol,start

set tabstop=2
set shiftwidth=2
set expandtab

" Disable backups
set noswapfile
set nobackup
set nowb

imap jj <ESC>

set ignorecase " all lowercase search terms search insensitively
set smartcase  " Adding an uppercase letter searches sensitively

" make j/k work by file line instead of screen line
nnoremap j gj
nnoremap k gk

" turn line numbering on
set ruler
set relativenumber
set numberwidth=6

" Fix search defaults
set ignorecase
set smartcase
set gdefault
set incsearch
set showmatch
set hlsearch
nnoremap <leader><cr> :set hlsearch!<cr>
nnoremap / /\v
vnoremap / /\v

" strip trailing whitespace
autocmd BufWritePre *.py,*.js,*.jsx,*.html,*.hbs,*.scss,*.php :%s/\s\+$//e
