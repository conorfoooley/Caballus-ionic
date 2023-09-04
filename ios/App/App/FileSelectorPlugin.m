#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(FileSelectorPlugin, "FileSelectorPlugin",
           CAP_PLUGIN_METHOD(GeneRateThumbnail, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(MoveVideoFileToPermanentLocation, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(UploadVideoFile, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(RemoveVideoFile, CAPPluginReturnPromise);
)
