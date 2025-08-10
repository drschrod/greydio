use clap::{Parser, Subcommand};
use greydio_crypto::Keypair;

#[derive(Parser)]
#[command(name = "greydio")]
#[command(about = "Greydio Chain CLI")]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    Keygen,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    match cli.cmd {
        Cmd::Keygen => {
            let kp = Keypair::generate();
            println!("pubkey: {}", hex::encode(kp.public()));
        }
    }
    Ok(())
}
