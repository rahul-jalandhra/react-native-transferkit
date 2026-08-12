#import <Foundation/Foundation.h>

@interface TKUploadManager : NSObject <
    NSURLSessionDelegate,
    NSURLSessionTaskDelegate,
    NSURLSessionDataDelegate
>

+ (instancetype)shared;

- (void)startUpload:(NSString *)taskId
                url:(NSString *)url
           filePath:(NSString *)filePath
           fileName:(NSString *)fileName
           mimeType:(NSString *)mimeType
          fieldName:(NSString *)fieldName
             method:(NSString *)method
            headers:(NSDictionary *)headers;

- (void)cancelUpload:(NSString *)taskId;

@end