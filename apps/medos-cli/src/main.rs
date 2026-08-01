#![forbid(unsafe_code)]

use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[command(name = "medos")]
#[command(about = "MEDOS Sentinel local security CLI")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    /// Show the implemented mobile foundation status.
    Status,
    /// Audit-chain operations.
    Audit {
        #[command(subcommand)]
        command: AuditCommand,
    },
    /// Evidence operations currently defined as safe interfaces.
    Evidence {
        #[command(subcommand)]
        command: EvidenceCommand,
    },
}

#[derive(Debug, Subcommand)]
enum AuditCommand {
    Inspect,
    Verify,
    Checkpoint,
}

#[derive(Debug, Subcommand)]
enum EvidenceCommand {
    List,
    Verify { id: String },
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Command::Status => {
            println!("MEDOS Sentinel mobile foundation: active");
            println!("Real microphone capture: disabled");
            println!("Synthetic audio profile: permitted");
            println!("Production infrastructure: not running");
        }
        Command::Audit { command } => match command {
            AuditCommand::Inspect => {
                println!("Audit inspection interface available.");
            }
            AuditCommand::Verify => {
                println!("Audit verification library available.");
            }
            AuditCommand::Checkpoint => {
                println!("Checkpoint interface available; durable store pending.");
            }
        },
        Command::Evidence { command } => match command {
            EvidenceCommand::List => {
                println!("Evidence durable service is a later implementation phase.");
            }
            EvidenceCommand::Verify { id } => {
                println!("Evidence verification requested for identifier: {id}");
                println!("No evidence was modified.");
            }
        },
    }
}
