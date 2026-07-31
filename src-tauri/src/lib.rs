#[cfg(desktop)]
use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      #[cfg(desktop)]
      {
        app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
        if !cfg!(debug_assertions) {
          let handle = app.handle().clone();
          tauri::async_runtime::spawn(async move {
            if let Err(err) = check_for_updates(handle).await {
              log::error!("update check failed: {err}");
            }
          });
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[cfg(desktop)]
async fn check_for_updates(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
  if let Some(update) = app.updater()?.check().await? {
    log::info!("found update {}", update.version);
    update
      .download_and_install(
        |chunk_length, content_length| {
          log::info!("downloaded {chunk_length} of {content_length:?}");
        },
        || log::info!("download finished"),
      )
      .await?;
    log::info!("update installed, restarting");
    app.restart();
  }
  Ok(())
}
