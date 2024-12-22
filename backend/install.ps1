function Check {
    param (
        $ErrorInfo
    )
    if (!($?)) {
        Write-Output $ErrorInfo
        Write-Output "Install failed"
        Read-Host | Out-Null ;
        Exit
    }
}

if (Test-Path "./venv/Scripts/activate") {
    Write-Output "Using existing venv"
}
else {
    Write-Output "Create .venv"
    ~/.local/bin/uv venv -p 3.10
}

. ./.venv/Scripts/activate

## TRELLIS
. TRELLIS/install.ps1

## required for text2img

# diffusers HEAD
~/.local/bin/uv pip install git+https://github.com/huggingface/diffusers
Check "Install diffusers failed"

~/.local/bin/uv pip install openai
Check "Install openai failed"