//
//  FileSelectorPlugin.swift
//  App
//
//  Created by Born Sprinter on 29/12/22.
//

import Foundation
import Capacitor
import AVFoundation

class UploadTaskDelegate: NSObject, URLSessionTaskDelegate {
    var call: CAPPluginCall
    var mediaId: String
    
    init(_ call: CAPPluginCall, _ mediaId: String) {
        call.keepAlive = true
        
        self.call = call
        self.mediaId = mediaId
    }
    
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError: Error?) {
        
        if let error = didCompleteWithError {
            print("FileSelectorPlugin Upload Error: \(String(describing: error.localizedDescription))")
            call.reject("Unknown error");
            return
        }
        
        guard let res = task.response as? HTTPURLResponse else {
            print("Upload completed with response:\(task.response?.description ?? "undefined")")
            //It should not happen at all
            return
        }
        
        print(res.description)
        
        if (200...299).contains(res.statusCode) {
            print("Upload completed successfully. Status code:\(res.statusCode)")
        }
        else if (400...499).contains(res.statusCode) {
            if (res.statusCode == 403) {
                call.reject("FileSelectorPlugin: Link expired!");
            } else {
                call.reject("FileSelectorPlugin: File upload failed with status code: \(res.statusCode)");
            }
            print("Upload fatal issue. Status code:\(res.statusCode)")
            return
        }
        else if (500...599).contains(res.statusCode) {
            print("Upload issue. Status code:\(res.statusCode)")
            call.reject("FileSelectorPlugin: File upload failed with status code: \(res.statusCode)");
            return
        }
        else {
            print("Upload completed with status code:\(res.statusCode)")
            call.reject("FileSelectorPlugin: File upload failed with status code: \(res.statusCode)");
            return
        }
        
        guard let response = task.response as? HTTPURLResponse else {
            call.reject("FileSelectorPlugin: Invalid response");
            return
        }
        
        print("FileSelectorPlugin StatusCode: \(response.statusCode)")
        call.resolve([
            "mediaId": mediaId,
            "uploadedBytes": call.getInt("end") ?? 0
        ])
        
        session.finishTasksAndInvalidate()
    }
}

@objc(FileSelectorPlugin)
public class FileSelectorPlugin: CAPPlugin, URLSessionDelegate {
    
    @objc func GeneRateThumbnail(_ call: CAPPluginCall) {
        
        guard let filePath = call.options["filePath"] as? String else {
            call.reject("File path must be provided")
            return
        }
        
        do {
            let fileUrl = URL(string: filePath)
            
            if FileManager.default.fileExists(atPath: fileUrl!.path) {
                var fileSize: Int64
                do {
                    let attr = try FileManager.default.attributesOfItem(atPath: fileUrl!.path)
                    fileSize = attr[FileAttributeKey.size] as! Int64
                    if (fileSize > 1048576 * 1000) {
                        call.reject("The maximum size allowed for an uploaded file is 1 GB.")
                        return
                    }
                } catch {
                    fileSize = 0
                    print("Error: \(error)")
                }
                
                // Thumbnail generation
                let avAsset = AVURLAsset(url: fileUrl!, options: nil)
                let imageGenerator = AVAssetImageGenerator(asset: avAsset)
                imageGenerator.appliesPreferredTrackTransform = true
                var thumbnail: UIImage?
                
                do {
                    thumbnail = try UIImage(cgImage: imageGenerator.copyCGImage(at: CMTime(seconds: 2, preferredTimescale: 1), actualTime: nil))
                    call.resolve([
                        "thumbnail": thumbnail?.jpegData(compressionQuality: 1)?.base64EncodedString() ?? "''",
                        "fileSize": fileSize
                    ])
                } catch let e as NSError {
                    print("FileSelectorPlugin Error: \(e.localizedDescription)")
                    call.reject("Thumbnail generation failed!")
                }
                
            } else {
                call.reject("FILE NOT AVAILABLE")
            }
        }
    }
    
    @objc func MoveVideoFileToPermanentLocation(_ call: CAPPluginCall) {
        guard let filePath = call.options["filePath"] as? String else {
            call.reject("File path must be provided")
            return
        }
        
        do {
            let fileName = filePath.components(separatedBy: "/").last
            let fileUrl = URL(string: filePath)
            
            let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
            let documentDirectory = paths[0]
            
            
            if FileManager.default.fileExists(atPath: fileUrl!.path) {
                let newUrl = documentDirectory.appendingPathComponent(fileName ?? "''")
                
                do {
                    try FileManager.default.moveItem(atPath: fileUrl!.path, toPath: newUrl.path)
                    call.resolve([
                        "newPath": newUrl.absoluteString
                    ])
                } catch let e as NSError {
                    print("FileSelectorPlugin Error: \(e.localizedDescription)")
                    call.reject("FileSelectorPlugin: File move failed! \(e.localizedDescription)")
                }
            } else {
                call.reject("FILE NOT AVAILABLE")
            }
        }
    }
    
    @objc func RemoveVideoFile(_ call: CAPPluginCall) {
        guard let filePath = call.options["filePath"] as? String else {
            call.reject("File path must be provided!")
            return
        }
        
        do {
            let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
            let documentDirectory = paths[0]
            let fileName = filePath.components(separatedBy: "/").last
            let fileUrl = documentDirectory.appendingPathComponent(fileName ?? "''")
            
            
            if FileManager.default.fileExists(atPath: fileUrl.path) {
                do {
                    try FileManager.default.removeItem(atPath: fileUrl.path)
                    call.resolve([
                        "message": "File delete successfully"
                    ])
                } catch let e as NSError {
                    print("FileSelectorPlugin Error: \(e.localizedDescription)")
                    call.reject("FileSelectorPlugin: File delete failed!")
                }
            } else {
                call.reject("FILE NOT AVAILABLE")
            }
        }
    }
    
    @objc func UploadVideoFile(_ call: CAPPluginCall) {
        guard let filePath = call.options["filePath"] as? String else {
            call.reject("File path must be provided")
            return
        }
        
        guard let uploadLink = call.options["uploadLink"] as? String else {
            call.reject("uploadLink must be provided")
            return
        }
        
        guard let mediaId = call.options["mediaId"] as? String else {
            call.reject("mediaId must be provided")
            return
        }
        
        guard let start = call.options["start"] as? Int else {
            call.reject("start must be provided")
            return
        }
        
        guard let end = call.options["end"] as? Int else {
            call.reject("end must be provided")
            return
        }
        
        do {
            let fileUrl = URL(string: filePath)
            let fileName = filePath.components(separatedBy: "/").last
            
            let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
            let documentDirectory = paths[0]
            
            if FileManager.default.fileExists(atPath: fileUrl!.path) {
                let fileToUpload = documentDirectory.appendingPathComponent("tmp_\(fileName ?? "''")")
                
                do {
                    let rawData: Data = try Data(contentsOf: fileUrl!)
                    let chunk: Data = rawData.subdata(in: start..<end)
                    try? chunk.write(to: fileToUpload)
                    
                } catch {
                    // Couldn't read the file.
                    print("FileSelectorPlugin:", "Couldn't read the file.")
                    call.reject("FileSelectorPlugin: File read failed!")
                    return
                }
                
                
                var request = URLRequest(url: URL(string: uploadLink)!)
                request.addValue("", forHTTPHeaderField: "Content-type")
                request.httpMethod = "PUT"
                
                let configuration = URLSessionConfiguration.background(withIdentifier: "com.caballus.app.background")
                configuration.isDiscretionary = true
                configuration.sessionSendsLaunchEvents = true
                
                let uploadDelegate = UploadTaskDelegate(call, mediaId)
                let session = URLSession(configuration: configuration, delegate: uploadDelegate, delegateQueue: OperationQueue.current)
                
                
                let uploadTask = session.uploadTask(with: request, fromFile: fileToUpload)
                uploadTask.resume()
            } else {
                call.reject("FileSelectorPlugin: File not found!")
            }
        }
    }
}
