#import "Transferkit.h"
#import <React/RCTBridgeModule.h>

#import "stream/TKStreamManager.h"
#import "upload/TKUploadManager.h"

@implementation Transferkit

RCT_EXPORT_MODULE()

- (void)startStream:(NSString *)url
             method:(NSString *)method
            headers:(NSDictionary *)headers
               body:(NSString *)body
{
    [[TKStreamManager shared]
        startStream:url
        method:method
        headers:headers
        body:body];
}

- (void)cancelStream
{
    [[TKStreamManager shared]
        cancelStream];
}

- (void)startBackgroundUpload:(NSString *)taskId
                          url:(NSString *)url
                     filePath:(NSString *)filePath
                     fileName:(NSString *)fileName
                     mimeType:(NSString *)mimeType
                    fieldName:(NSString *)fieldName
                       method:(NSString *)method
                      headers:(NSDictionary *)headers
{
    [[TKUploadManager shared]
        startUpload:taskId
        url:url
        filePath:filePath
        fileName:fileName
        mimeType:mimeType
        fieldName:fieldName
        method:method
        headers:headers];
}

- (void)cancelUpload:(NSString *)taskId
{
    [[TKUploadManager shared]
        cancelUpload:taskId];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeTransferkitSpecJSI>(params);
}
#endif

@end