
              const dexieRecord = objectify(record);
              if (!await $table.where(pickPrimitive(dexieRecord)).count()) {
                await $table.add({...dexieRecord as any});
              }
            })
          )
          /* Dexie END */
        } 
      }
      else {
        const record = data instanceof FormData ? data : singleBodySchemaOfPost.cast(data);
        /* Dexie START */
        const dexieRecord = objectify(record);
        await $table.add(singleBodySchemaOfPost.cast(dexieRecord) as any);
        /* Dexie END */
      }
      return NextResponse.json({code: 0});
    }
    catch(e) {
      return NextResponse.json({
        code: 1,
        // error: e, // the error instance thrown from Dexie might be not able to serialized through JSON.stringify, uncomment this line if you're sure JSON.stringify(e) will not hit a new error.
        message: (e as {message?: string}).message,
      });
    }
  }
); --}}