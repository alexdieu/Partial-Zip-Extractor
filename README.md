# Partial ZIP Extractor

This browser extension intercepts ZIP file downloads and allows you to selectively download files from within the archive. This is particularly useful for large ZIP files, as it can save bandwidth by only downloading the files you need, especially when the server supports HTTP range requests.

## How It Works

When you click on a link to a ZIP file, this extension will:
1.  Intercept the download.
2.  Display a modal on the page with a list of all the files contained within the ZIP archive.
3.  Allow you to select which files you want to download.
4.  Download only the selected files.

If the server hosting the ZIP file supports partial downloads (HTTP range requests), the extension will only download the portions of the ZIP file necessary to extract the selected files. If not, the entire ZIP file will be downloaded to your computer's memory, and the selected files will be extracted from there.

The extension also tracks your bandwidth usage, showing you how much data you've downloaded and how much you've saved by using this extension. You can view these stats by clicking on the extension's icon in your browser's toolbar.

## Features

* **Selective file download:** Choose which files to download from a ZIP archive.
* **Bandwidth saving:** Reduces data usage by avoiding the download of unnecessary files, especially with servers that support partial content.
* **User-friendly interface:** A clean and simple modal allows for easy file selection.
* **Bandwidth statistics:** Track your total and monthly downloaded and saved data.
* **Broad compatibility:** Works with any website, as it's a browser extension.

## Contributing

We welcome contributions to this project! If you'd like to help, please follow these steps:

1.  **Fork the repository.**
2.  **Clone your fork to your local machine.**
3.  **Make your changes.** A good place to start would be to add support for other archive formats like RAR or 7-Zip. This would likely involve:
    * Finding a suitable JavaScript library for the new archive format (similar to `unzipit.min.js`).
    * Modifying `background.js` to handle the new file type and its extraction logic.
    * Updating `content.js` to correctly display the contents of the new archive type in the modal.
4.  **Test your changes thoroughly.**
5.  **Create a pull request** with a clear description of your changes.

## License

**MIT License**
