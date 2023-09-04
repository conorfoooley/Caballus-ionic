package com.caballusapp.app;

import android.graphics.Bitmap;
import android.media.ThumbnailUtils;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.util.Objects;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

@CapacitorPlugin(name = "FileSelectorPlugin")
public class FileSelectorPlugin extends Plugin {
  @PluginMethod
  public void GeneRateThumbnail(PluginCall call) {
    String filePath = call.getString("filePath");
    assert filePath != null;
    File file = new File(filePath);
    try {
      if (file.exists()) {
        if (file.length() > 1048576 * 1000) {
          call.reject("The maximum size allowed for an uploaded file is 1 GB.");
          return;
        }

        Bitmap thumb = ThumbnailUtils.createVideoThumbnail(filePath, MediaStore.Images.Thumbnails.MINI_KIND);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        thumb.compress(Bitmap.CompressFormat.PNG, 100, outputStream);

        JSObject result = new JSObject();
        result.put("thumbnail", Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT));
        result.put("fileSize", file.length());
        call.resolve(result);
      } else {
        call.reject("File not found!");
      }
    } catch (Exception e) {
      e.printStackTrace();
      call.reject("FileSelectorPlugin: GeneRateThumbnail failed");
    }
  }

  @PluginMethod
  public void ReadFile(PluginCall call) {
    String filePath = call.getString("filePath");
    assert filePath != null;
    File file = new File(filePath);
    if (file.exists()) {
      FileInputStream objFileIS = null;
      try {
        System.out.println("file = >>>> <<<<<" + filePath);
        objFileIS = new FileInputStream(filePath);
      } catch (FileNotFoundException e) {
        e.printStackTrace();
      }
      ByteArrayOutputStream objByteArrayOS = new ByteArrayOutputStream();
      byte[] byteBufferString = new byte[1024];
      try {
        for (int readNum; (readNum = Objects.requireNonNull(objFileIS).read(byteBufferString)) != -1; ) {
          objByteArrayOS.write(byteBufferString, 0, readNum);
          System.out.println("read " + readNum + " bytes,");
        }
      } catch (IOException e) {
        e.printStackTrace();
      }

      String videodata = Base64.encodeToString(objByteArrayOS.toByteArray(), Base64.DEFAULT);
      Log.d("VideoData**>  ", videodata);

      JSObject result = new JSObject();
      result.put("base64", videodata);
      call.resolve(result);
    } else {
      call.reject("File not found!");
    }
  }

  @PluginMethod
  public void ReadVideoFile(PluginCall call) {
    String filePath = call.getString("filePath");
    assert filePath != null;

    File file = new File(filePath);
    if (file.exists()) {
      if (file.length() > 1048576 * 1000) {
        call.reject("The maximum size allowed for an uploaded file is 1 GB.");
        return;
      }

      FileInputStream objFileIS = null;
      try {
        System.out.println("file = >>>> <<<<<" + filePath);
        objFileIS = new FileInputStream(filePath);
      } catch (FileNotFoundException e) {
        e.printStackTrace();
      }

      ByteArrayOutputStream objByteArrayOS = new ByteArrayOutputStream();
      byte[] byteBufferString = new byte[1024];
      try {
        for (int readNum; (readNum = Objects.requireNonNull(objFileIS).read(byteBufferString)) != -1; ) {
          objByteArrayOS.write(byteBufferString, 0, readNum);
          System.out.println("read " + readNum + " bytes,");
        }
      } catch (IOException e) {
        e.printStackTrace();
      }

      String videodata = Base64.encodeToString(objByteArrayOS.toByteArray(), Base64.DEFAULT);
      Log.d("VideoData**>  ", videodata);

      // generate thumbnail
      Bitmap thumb = ThumbnailUtils.createVideoThumbnail(filePath, MediaStore.Images.Thumbnails.MINI_KIND);
      ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
      thumb.compress(Bitmap.CompressFormat.PNG, 100, outputStream);

      // return result
      JSObject result = new JSObject();
      result.put("base64", videodata);
      result.put("thumbnail", Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT));
      call.resolve(result);
    } else {
      call.reject("File not found!");
    }
  }

  @PluginMethod
  public void MoveVideoFileToPermanentLocation(PluginCall call) throws IOException {
    String filePath = call.getString("filePath");
    assert filePath != null;

    File file = new File(filePath);
    if (file.exists()) {
      if (file.length() > 1048576 * 1000) {
        call.reject("The maximum size allowed for an uploaded file is 1 GB.");
        return;
      }


      // copy file code
      Timestamp timestamp = new Timestamp(System.currentTimeMillis());
      String newPath = getActivity().getFilesDir().toString() + File.separator + timestamp.getTime() + "_" + file.getName();
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        try {
          Files.copy(
            file.toPath(),
            Paths.get(newPath)
          );
        } catch (IOException e) {
          e.printStackTrace();
          call.reject("File copy failed!");

        }
      } else {
        // copy file code
        try (InputStream is = new FileInputStream(filePath); OutputStream os = new FileOutputStream(newPath)) {
          // buffer size 1K
          byte[] buf = new byte[1024];
          int bytesRead;
          while ((bytesRead = is.read(buf)) > 0) {
            os.write(buf, 0, bytesRead);
          }
        } catch (Exception e) {
          e.printStackTrace();
          call.reject("File copy failed!");
        }
      }

      JSObject result = new JSObject();
      result.put("newPath", newPath);
      call.resolve(result);
    } else {
      call.reject("File not found!");
    }
  }

  @PluginMethod
  public void RemoveVideoFile(PluginCall call) throws IOException {
    String filePath = call.getString("filePath");
    assert filePath != null;

    File file = new File(filePath);
    if (file.exists()) {
      boolean isDelete = file.delete();
      if (!isDelete) {
        System.out.println("FileSelectorPlugin: file delete failed!");
        call.reject("File delete failed");
      } else {
        JSObject result = new JSObject();
        result.put("message", "File delete successfully");
        call.resolve(result);
      }
    } else {
      call.reject("File not found!");
    }
  }

  @PluginMethod
  public void UploadVideoFile(PluginCall capCall) {
    String uploadLink = capCall.getString("uploadLink");
    assert uploadLink != null;

    String filePath = capCall.getString("filePath");
    assert filePath != null;

    Integer start = capCall.getInt("start");
    assert start != null;

    Integer end = capCall.getInt("end");
    assert end != null;

    String mediaId = capCall.getString("mediaId");
    assert mediaId != null;

    //creating a file
    File file = new File(filePath);

    try {
      if (file.exists()) {
        OkHttpClient client = new OkHttpClient();

        int diff = end - start;
        byte[] buffer = new byte[diff];
        RandomAccessFile randomAccessFile = new RandomAccessFile(file, "r");
        randomAccessFile.seek(start);
        randomAccessFile.read(buffer);

        File tempFile = new File(file.getParent(), "tmp_" + file.getName());
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
          fos.write(buffer);
        } catch (IOException e) {
          System.out.println("FileSelectorPlugin: ======================");
          e.printStackTrace();
          System.out.println("FileSelectorPlugin: File not found!");
          System.out.println("FileSelectorPlugin: ======================");
          capCall.reject("FileSelectorPlugin: File create failed:");
          return;
        }

        RequestBody requestBody = RequestBody.create(null, tempFile);

        Request request = new Request.Builder().url(uploadLink)
          .put(requestBody).build();

        Response response = client.newCall(request).execute();
        if (!response.isSuccessful()) {
          if (response.code() == 403) {
            capCall.reject("FileSelectorPlugin: Link expired!");
          } else {
            capCall.reject("FileSelectorPlugin: File upload failed with status code: " + response.code());
          }
          System.out.println("FileSelectorPlugin: File not uploaded" + response.code());
          return;
        }

        // return success
        JSObject result = new JSObject();
        result.put("mediaId", mediaId);
        result.put("uploadedBytes", end);
        capCall.resolve(result);
        tempFile.delete();
      } else {
        capCall.reject("FileSelectorPlugin: File not found!");
      }
    } catch (Exception e) {
      capCall.reject("FileSelectorPlugin: Something went wrong!");
    }
  }
}
